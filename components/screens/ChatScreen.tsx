'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppState, CorrectionCard, Expression, FestivalScenarioId, Message } from '@/types';
import { festivalScenarios } from '@/lib/festivalScenarios';
import { askTsumugi } from '@/lib/chatTransport';
import { fillName } from '@/lib/learnerName';
import { alternatives, sameWords } from '@/lib/speechMatch';
import { sceneSrc } from '@/lib/scenes';
import {
  addMistake,
  addBondPoints,
  addSessionStats,
  markScenarioCleared,
  type BondGain,
} from '@/lib/storage';
import { getScenarioIntro, getClosingLine, getPraise, inferExpression } from '@/lib/tsumugiVoice';
import { speakText, stopAllSpeech, unlockIOSAudio, initializeTTSVoices, probeCloudTTS } from '@/lib/ttsVoice';
import { speakJa, stopVoice } from '@/lib/tsumugiSpeech';
import { playSfx } from '@/lib/sfx';
import { haptic } from '@/lib/haptics';
import TsumugiArt from '@/components/tsumugi/TsumugiArt';
import MicButton from '@/components/tsumugi/MicButton';
import type { LevelUpEvent } from '@/components/TsumugiApp';

/** 何ターン話したらクリア扱いにするか */
const TURNS_TO_CLEAR = 5;

interface Props {
  scenarioId: FestivalScenarioId;
  state: AppState;
  onExit: () => void;
  onLevelUp: (e: LevelUpEvent) => void;
}

/* ------------------------- レスポンスの解析 ------------------------- */

const CORRECTION_RE = /<correction>\s*([\s\S]*?)\s*<\/correction>/i;
const TRANSLATION_RE = /<ja>\s*([\s\S]*?)\s*<\/ja>/i;
/** かな・漢字を含むか（日本語で「なんて言うの？」と聞いた添削の見せ方を変える） */
const JA_CHARS = /[぀-ヿ㐀-鿿]/;

/**
 * 読み上げる本文を整える。「*(speaks slower)*」のようなト書きが混ざることがあり、
 * そのまま読み上げると台無しになる。強調の * は記号だけ落とす。
 */
function cleanSpoken(text: string): string {
  return text
    .replace(/\*\([^)]*\)\*/g, '')
    .replace(/\*/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * 直していない「添削」を捨てる。正しい文にも「完璧です！」と同じ文を返してくることがあり
 * （測ったら正しい文6回中3回）、そのまま出すと正しい文が取り消し線つきで復習に残る。
 */
function isRealCorrection(c: CorrectionCard): boolean {
  return !alternatives(c.better).some((alt) => sameWords(c.said, alt));
}

function parseReply(raw: string): { text: string; translation?: string; correction?: CorrectionCard } {
  const translation = raw.match(TRANSLATION_RE)?.[1]?.trim() || undefined;
  const body = raw.replace(TRANSLATION_RE, '').replace(/<\/?ja>/gi, '');
  const match = body.match(CORRECTION_RE);
  const text = cleanSpoken(body.replace(CORRECTION_RE, ''));
  if (!match) return { text, translation };

  try {
    const parsed = JSON.parse(match[1]) as Partial<CorrectionCard>;
    if (parsed.said && parsed.better && parsed.why) {
      const correction: CorrectionCard = {
        said: parsed.said,
        better: parsed.better,
        why: parsed.why,
        severity: parsed.severity ?? 'minor',
      };
      return isRealCorrection(correction) ? { text, translation, correction } : { text, translation };
    }
  } catch {
    /* 壊れたJSONは黙って捨てる。会話が止まる方が損。 */
  }
  return { text, translation };
}

export default function ChatScreen({ scenarioId, state, onExit, onLevelUp }: Props) {
  const scenario = festivalScenarios[scenarioId];

  const [startedAt] = useState(() => Date.now());
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'opener',
      role: 'assistant',
      content: scenario.opener,
      translation: scenario.openerJa,
      timestamp: startedAt,
      expression: 'smile',
    },
  ]);
  /** 「訳」を開いている返事 */
  const [shownJa, setShownJa] = useState<ReadonlySet<string>>(() => new Set());
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [expression, setExpression] = useState<Expression>('smile');
  const [showPhrases, setShowPhrases] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(() => scenario.missions.map(() => false));
  const [summary, setSummary] = useState<{ turns: number; corrections: number; gain: BondGain } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const corrections = useRef(0);

  const intro = useMemo(
    () => getScenarioIntro(scenario.title, state.bond.level),
    [scenario.title, state.bond.level]
  );
  const userTurns = messages.filter((m) => m.role === 'user').length;
  const remainingToClear = Math.max(0, TURNS_TO_CLEAR - userTurns);

  useEffect(() => {
    initializeTTSVoices();
    probeCloudTTS();
    return () => stopAllSpeech();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, thinking]);

  const speak = useCallback(
    (text: string) => {
      if (!text) return;
      stopAllSpeech();
      setSpeaking(true);
      speakText(text, {
        onEnd: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    },
    []
  );

  const send = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || thinking) return;

      unlockIOSAudio();
      stopAllSpeech();
      setSpeaking(false);
      playSfx('send');
      haptic('light');

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      const next = [...messages, userMsg];
      setMessages(next);
      setInput('');
      setThinking(true);
      setExpression('thinking');

      try {
        const answer = await askTsumugi({
          // 訳はお手本として履歴に残す。消して送ると、数往復で <ja> を付けなくなった（4往復で 1/4）
          messages: next.map(({ role, content, translation }) => ({
            role,
            content: role === 'assistant' && translation ? `${content}\n<ja>${translation}</ja>` : content,
          })),
          mode: 'festival',
          level: state.profile.currentLevel,
          festivalScenario: scenarioId,
          successfulTurns: userTurns,
          bondLevel: state.bond.level,
          userName: state.profile.displayName,
        });

        const { text: reply, translation, correction } = parseReply(answer);
        // 直してくれる場面は、考え顔より指差しのほうが意図が伝わる
        const expr: Expression = correction ? 'point' : inferExpression(reply);

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: reply || '…',
            timestamp: Date.now(),
            correction,
            expression: expr,
            translation,
          },
        ]);
        setExpression(expr);

        // 直されたときは受信音ではなく、やわらかい音にする
        playSfx(correction ? 'soft' : 'receive');

        if (correction) {
          corrections.current += 1;
          addMistake(correction, 'festival');
        }

        const gain = addBondPoints(correction ? 2 : 3);
        if (gain.leveledUp) onLevelUp({ level: gain.newLevel, unlocked: gain.unlocked });

        if (state.settings.autoSpeak && reply) speak(reply);
      } catch (error) {
        console.error(error);
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: "Sorry — I lost you for a second there. Could you say that again?",
            timestamp: Date.now(),
            expression: 'sad',
          },
        ]);
        setExpression('sad');
      } finally {
        setThinking(false);
      }
    },
    [messages, thinking, state, scenarioId, userTurns, onLevelUp, speak]
  );

  const finish = () => {
    stopAllSpeech();
    const duration = Date.now() - startedAt;

    addSessionStats({
      messagesCount: messages.length,
      correctionsCount: corrections.current,
      duration,
      mode: 'festival',
      scenarioId,
      date: new Date().toISOString(),
    });

    let gain: BondGain = { points: state.bond.points, leveledUp: false, newLevel: state.bond.level };
    if (userTurns >= TURNS_TO_CLEAR) {
      markScenarioCleared(scenarioId);
      gain = addBondPoints(10);
    }
    setSummary({ turns: userTurns, corrections: corrections.current, gain });
  };

  /* ------------------------------ 画面 ------------------------------ */

  return (
    <div
      className={`mx-auto flex h-[100dvh] w-full max-w-lg flex-col ${
        state.settings.reduceMotion ? '' : 'anim-enter-deep'
      }`}
    >
      {/* --------------------------- ヘッダー --------------------------- */}
      <header
        className="safe-top shrink-0 px-4 pb-2.5 pt-2"
        style={{
          background: 'var(--surface)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              stopAllSpeech();
              onExit();
            }}
            aria-label="もどる"
            className="tsu-btn grid h-10 w-10 shrink-0 place-items-center text-[17px]"
            style={{ background: 'var(--tsu-pink-100)' }}
          >
            ←
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-extrabold" style={{ color: 'var(--text)' }}>
              {scenario.emoji} {scenario.title}
            </p>
            <p className="truncate text-[11px] font-semibold" style={{ color: 'var(--text-faint)' }}>
              相手：{scenario.partner.name}（{scenario.partner.from}）
            </p>
          </div>

          <button
            type="button"
            onClick={finish}
            className="tsu-btn shrink-0 px-3.5 py-2 text-[12px] font-extrabold"
            style={{ background: 'var(--tsu-pink-100)', color: 'var(--tsu-pink-600)' }}
          >
            おわる
          </button>
        </div>

        {/* ミッション */}
        <div className="tsu-scroll mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
          {scenario.missions.map((m, i) => (
            <button
              key={m}
              type="button"
              onClick={() => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))}
              aria-pressed={checked[i]}
              className="tsu-btn shrink-0 whitespace-nowrap px-2.5 py-1 text-[10.5px] font-extrabold"
              style={{
                background: checked[i] ? 'var(--tsu-pink-500)' : 'var(--tsu-pink-100)',
                color: checked[i] ? '#fff' : 'var(--text-soft)',
              }}
            >
              {checked[i] ? '✓' : '☐'} {m}
            </button>
          ))}
        </div>
      </header>

      {/* ------------------------ 紬とシーン背景 ------------------------ */}
      <div
        className="relative flex shrink-0 items-end justify-center overflow-hidden"
        style={{ height: 172, borderBottom: '1px solid var(--border)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- 装飾用の背景。next/image を挟む意味がない */}
        <img
          src={sceneSrc(scenarioId)}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* 立ち絵を浮かせるための薄いスクリム */}
        <div className="absolute inset-0" style={{ background: 'rgba(30, 14, 26, 0.18)' }} aria-hidden />
        {/* 下端は会話に向けて溶かす。背景を会話の下まで引っぱると読みにくい。 */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ height: 72, background: 'linear-gradient(to bottom, transparent, var(--bg))' }}
          aria-hidden
        />

        <div className="relative" style={{ marginBottom: -34 }}>
          <TsumugiArt
            expression={expression}
            outfit={state.bond.currentOutfit}
            speaking={speaking}
            size={200}
            reduceMotion={state.settings.reduceMotion}
            effects={state.settings.sfxEnabled}
          />
        </div>

        {remainingToClear > 0 ? (
          <span
            className="absolute right-3 top-2.5 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold"
            style={{ background: 'rgba(0,0,0,0.42)', color: '#fff', backdropFilter: 'blur(4px)' }}
          >
            あと {remainingToClear} 往復でクリア
          </span>
        ) : (
          <span
            className="absolute right-3 top-2.5 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold text-white"
            style={{ background: 'var(--tsu-pink-500)' }}
          >
            ✓ クリア条件たっせい
          </span>
        )}
      </div>

      {/* --------------------------- 会話 --------------------------- */}
      <div className="tsu-scroll flex-1 overflow-y-auto px-4 pt-2">
        <p
          className="mx-auto mb-3 max-w-[300px] rounded-2xl px-3.5 py-2 text-center text-[11.5px] font-semibold leading-relaxed"
          style={{ background: 'var(--tsu-lav-100)', color: 'var(--text-soft)' }}
        >
          {intro.text}
          <span className="mt-1 block text-[11px] font-bold" style={{ color: 'var(--tsu-pink-600)' }}>
            英語が出てこない時は、日本語で聞いてもいいよ
          </span>
        </p>

        <ul className="flex flex-col gap-2.5 pb-3">
          {messages.map((m) => (
            <li key={m.id} className="anim-up">
              {m.role === 'assistant' ? (
                <div className="flex max-w-[86%] flex-col gap-1.5">
                  <div
                    className="tsu-card-solid px-4 py-3 text-[15px] font-medium leading-relaxed"
                    style={{ borderTopLeftRadius: 8, color: 'var(--text)' }}
                  >
                    {m.content}
                    {m.translation && shownJa.has(m.id) && (
                      <span
                        className="anim-up mt-2 block border-t pt-2 text-[13px] font-semibold leading-relaxed"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-soft)' }}
                      >
                        {m.translation}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => speak(m.content)}
                      className="tsu-btn px-2.5 py-1 text-[11px] font-extrabold"
                      style={{ background: 'var(--tsu-pink-100)', color: 'var(--tsu-pink-600)' }}
                    >
                      🔊 きく
                    </button>
                    {m.translation && (
                      <button
                        type="button"
                        onClick={() =>
                          setShownJa((prev) => {
                            const next = new Set(prev);
                            if (next.has(m.id)) next.delete(m.id);
                            else next.add(m.id);
                            return next;
                          })
                        }
                        aria-pressed={shownJa.has(m.id)}
                        className="tsu-btn px-2.5 py-1 text-[11px] font-extrabold"
                        style={{
                          background: shownJa.has(m.id) ? 'var(--tsu-lav-400)' : 'var(--tsu-lav-100)',
                          color: shownJa.has(m.id) ? '#fff' : 'var(--tsu-lav-400)',
                        }}
                      >
                        訳
                      </button>
                    )}
                  </div>
                  {m.correction && <CorrectionBlock correction={m.correction} bondLevel={state.bond.level} />}
                </div>
              ) : (
                <div className="flex justify-end">
                  <div
                    className="max-w-[86%] px-4 py-3 text-[15px] font-semibold leading-relaxed text-white"
                    style={{
                      borderRadius: 22,
                      borderTopRightRadius: 8,
                      background: 'linear-gradient(135deg, var(--tsu-pink-400), var(--tsu-pink-600))',
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              )}
            </li>
          ))}

          {thinking && (
            <li className="anim-pop">
              <div className="tsu-card-solid inline-flex items-center gap-1.5 px-4 py-3.5" style={{ borderTopLeftRadius: 8 }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`anim-dot ${i === 1 ? 'anim-dot-2' : i === 2 ? 'anim-dot-3' : ''} h-2 w-2 rounded-full`}
                    style={{ background: 'var(--tsu-pink-400)' }}
                  />
                ))}
              </div>
            </li>
          )}
        </ul>
        <div ref={bottomRef} />
      </div>

      {/* ------------------------- フレーズ引き出し ------------------------- */}
      {showPhrases && (
        <div
          className="anim-up tsu-scroll max-h-[38vh] shrink-0 overflow-y-auto px-4 pb-2"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <p className="sticky top-0 py-2 text-[11px] font-extrabold" style={{ background: 'var(--surface)', color: 'var(--text-faint)' }}>
            タップで入力欄に入ります
          </p>
          <ul className="flex flex-col gap-1.5 pb-2">
            {scenario.phrases.map((p) => {
              const en = fillName(p.en, state.profile.displayName, 'en');
              return (
                <li key={p.en}>
                  <button
                    type="button"
                    onClick={() => {
                      setInput(en);
                      setShowPhrases(false);
                    }}
                    className="tsu-btn tsu-card-solid w-full px-3.5 py-2.5 text-left !rounded-2xl"
                  >
                    <span className="block text-[14px] font-extrabold" style={{ color: 'var(--text)' }}>
                      {p.star && '⭐️ '}
                      {en}
                    </span>
                    <span className="block text-[11.5px] font-semibold" style={{ color: 'var(--text-faint)' }}>
                      {fillName(p.ja, state.profile.displayName, 'ja')}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* --------------------------- 入力 --------------------------- */}
      <div
        className="safe-bottom shrink-0 px-3 pb-2 pt-2"
        style={{
          background: 'var(--surface)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setShowPhrases((v) => !v)}
            aria-label="フレーズを見る"
            aria-expanded={showPhrases}
            className="tsu-btn grid h-12 w-12 shrink-0 place-items-center text-[19px]"
            style={{ background: showPhrases ? 'var(--tsu-pink-300)' : 'var(--tsu-pink-100)' }}
          >
            💡
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="英語で話しかけてみて…"
            aria-label="メッセージ"
            className="tsu-card-solid max-h-28 min-h-[48px] flex-1 resize-none px-4 py-3 outline-none"
            style={{ color: 'var(--text)', borderRadius: 24 }}
          />

          <MicButton onResult={(t) => send(t)} onInterim={setInput} disabled={thinking} />

          <button
            type="button"
            onClick={() => send(input)}
            disabled={!input.trim() || thinking}
            aria-label="送信"
            className="tsu-btn tsu-btn-primary grid h-12 w-12 shrink-0 place-items-center text-[18px]"
          >
            ↑
          </button>
        </div>
      </div>

      {/* --------------------------- まとめ --------------------------- */}
      {summary && (
        <SessionSummary
          scenarioTitle={scenario.title}
          turns={summary.turns}
          corrections={summary.corrections}
          gain={summary.gain}
          bondLevel={state.bond.level}
          outfit={state.bond.currentOutfit}
          cleared={summary.turns >= TURNS_TO_CLEAR}
          reduceMotion={state.settings.reduceMotion}
          jaVoice={state.settings.jaVoice}
          onClose={() => {
            setSummary(null);
            onExit();
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  訂正カード                                                          */
/* ------------------------------------------------------------------ */

const SEVERITY: Record<CorrectionCard['severity'], { label: string; color: string }> = {
  minor: { label: 'ちいさな差', color: 'var(--tsu-mint)' },
  moderate: { label: 'おぼえたい', color: 'var(--tsu-gold)' },
  important: { label: 'だいじ', color: 'var(--tsu-pink-500)' },
};

/** 日本語で「なんて言うの？」と聞いたときの答え。間違いではないので取り消し線にしない */
const HOW_TO_SAY = { label: '言い方', color: 'var(--tsu-lav-400)' };

function CorrectionBlock({ correction, bondLevel }: { correction: CorrectionCard; bondLevel: number }) {
  const askedInJapanese = JA_CHARS.test(correction.said);
  const meta = askedInJapanese ? HOW_TO_SAY : SEVERITY[correction.severity];
  const [praise] = useState(() => getPraise(bondLevel));

  return (
    <div
      className="anim-pop rounded-[22px] px-4 py-3.5"
      style={{ background: 'var(--tsu-pink-50)', border: `1.5px solid ${meta.color}` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white"
          style={{ background: meta.color }}
        >
          {meta.label}
        </span>
        <span className="text-[11px] font-extrabold" style={{ color: 'var(--text-faint)' }}>
          {askedInJapanese ? '英語ではこう言うよ' : '紬がそっと直してくれた'}
        </span>
      </div>

      {askedInJapanese ? (
        <p className="mt-2 text-[13px] font-semibold" style={{ color: 'var(--text-soft)' }}>
          言いたかったこと：{correction.said}
        </p>
      ) : (
        <p className="mt-2 text-[13.5px] font-semibold line-through" style={{ color: 'var(--text-faint)' }}>
          {correction.said}
        </p>
      )}
      <p className="mt-0.5 text-[16px] font-extrabold leading-snug" style={{ color: 'var(--tsu-pink-600)' }}>
        {correction.better}
      </p>
      <p className="mt-1.5 text-[12.5px] font-semibold leading-relaxed" style={{ color: 'var(--text-soft)' }}>
        {correction.why}
      </p>
      <p className="mt-2 text-[11.5px] font-bold" style={{ color: 'var(--text-faint)' }}>
        「{praise.text}」
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  セッションまとめ                                                     */
/* ------------------------------------------------------------------ */

function SessionSummary({
  scenarioTitle,
  turns,
  corrections,
  gain,
  bondLevel,
  outfit,
  cleared,
  reduceMotion,
  jaVoice,
  onClose,
}: {
  scenarioTitle: string;
  turns: number;
  corrections: number;
  gain: BondGain;
  bondLevel: number;
  outfit: AppState['bond']['currentOutfit'];
  cleared: boolean;
  reduceMotion: boolean;
  jaVoice: boolean;
  onClose: () => void;
}) {
  const [line] = useState(() => getClosingLine(bondLevel, corrections));

  useEffect(() => {
    if (cleared) {
      playSfx('unlock');
      haptic('medium');
    }
    if (jaVoice) speakJa(line.id);
    return () => stopVoice();
  }, [cleared, jaVoice, line.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(40, 20, 34, 0.55)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="セッションのまとめ"
    >
      <div className="tsu-card-solid anim-levelup w-full max-w-sm px-6 pb-6 pt-6 text-center">
        {cleared && (
          <p
            className="mx-auto mb-1 w-fit rounded-full px-3 py-1 text-[11px] font-extrabold text-white"
            style={{ background: 'var(--tsu-pink-500)' }}
          >
            ✓ 「{scenarioTitle}」クリア
          </p>
        )}

        <TsumugiArt
          expression={cleared ? 'cheer' : line.expression}
          outfit={outfit}
          size={170}
          reduceMotion={reduceMotion}
        />

        <p className="mt-1 text-[15px] font-bold leading-relaxed" style={{ color: 'var(--text)' }}>
          「{line.text}」
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SummaryStat label="往復" value={`${turns}`} />
          <SummaryStat label="直した数" value={`${corrections}`} />
          <SummaryStat label="ハート" value={`+${cleared ? 10 : 0}`} />
        </div>

        {gain.leveledUp && (
          <p
            className="mt-3 rounded-2xl px-4 py-2 text-[13px] font-extrabold"
            style={{ background: 'var(--tsu-pink-100)', color: 'var(--tsu-pink-600)' }}
          >
            💗 親密度が Lv.{gain.newLevel} になりました
          </p>
        )}

        <button type="button" onClick={onClose} className="tsu-btn tsu-btn-primary mt-5 w-full py-3.5 text-[15px]">
          もどる
        </button>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl px-2 py-2.5" style={{ background: 'var(--tsu-pink-50)' }}>
      <p className="text-[19px] font-extrabold leading-none" style={{ color: 'var(--tsu-pink-600)' }}>
        {value}
      </p>
      <p className="mt-1 text-[10.5px] font-extrabold" style={{ color: 'var(--text-faint)' }}>
        {label}
      </p>
    </div>
  );
}
