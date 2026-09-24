import { apiUrl } from '@/lib/apiBase';
import { getSystemPrompt } from '@/lib/prompts';
import type {
  BusinessScenario,
  ChatMode,
  DifficultyLevel,
  FestivalScenarioId,
  LanguageLevel,
} from '@/types';

/**
 * 紬の返事をもらう経路。
 *
 * 通常は自前の /api/chat（DeepSeek）に投げる。
 * ただしこのアプリは「サーバーの無い場所」に置かれることがある。
 *   - claude.ai に静的ページとして公開したお試し版
 *   - Capacitor で NEXT_PUBLIC_API_BASE を渡し忘れたビルド
 * そういう場所では window.claude 経由で Claude に直接聞く。
 * どちらも使えなければ呼び出し側が「聞こえなかった」演出に落とす。
 *
 * サーバー側と同じ会話が成立するよう、システムプロンプトは
 * lib/prompts.ts の getSystemPrompt() を共用している。
 * Claude の sample には system ロールが無いので、先頭の user ターンに入れる。
 */

/** 直近のやり取りだけ送ってトークンと遅延を抑える（/api/chat と同じ） */
const MAX_HISTORY = 16;

export interface AskInput {
  /** アプリ側の Message と同じ形。system は Claude 経路では落とす。 */
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  mode: ChatMode;
  level: LanguageLevel;
  businessScenario?: BusinessScenario;
  businessDifficulty?: DifficultyLevel;
  festivalScenario?: FestivalScenarioId;
  successfulTurns?: number;
  bondLevel?: number;
}

interface SampleResult {
  text: string;
}
type SampleFn = (
  input: Array<{ role: 'user' | 'assistant'; content: string }>,
  options?: { cache?: boolean; modelTier?: string; signal?: AbortSignal }
) => Promise<SampleResult>;

interface ClaudeHost {
  use(name: 'sample'): Promise<SampleFn | null>;
}

/**
 * claude.use() は「まだ返事が無い」状態が10秒続くことがある。
 * 初回だけ待って、その結果を使い回す。
 */
let samplePromise: Promise<SampleFn | null> | null = null;

function getSample(): Promise<SampleFn | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  const host = (window as unknown as { claude?: ClaudeHost }).claude;
  if (!host || typeof host.use !== 'function') return Promise.resolve(null);
  samplePromise ??= host.use('sample').catch(() => null);
  return samplePromise;
}

/** このページで Claude に直接聞けるか（UIの出し分け用） */
export async function canAskClaudeDirectly(): Promise<boolean> {
  return (await getSample()) !== null;
}

function buildPrompt(input: AskInput): string {
  return getSystemPrompt(
    input.mode,
    input.level,
    input.businessScenario,
    input.businessDifficulty,
    input.successfulTurns,
    input.festivalScenario,
    input.bondLevel
  );
}

async function askViaClaude(
  sample: SampleFn,
  input: AskInput,
  signal?: AbortSignal
): Promise<string> {
  // sample には system ロールが無いので落とす（指示は先頭の user ターンに入る）。
  const history = input.messages
    .filter((m) => m.role !== 'system' && m.content.trim().length > 0)
    .slice(-MAX_HISTORY) as Array<{ role: 'user' | 'assistant'; content: string }>;

  // sample の入力は user ターンで始まり user ターンで終わる必要がある。
  // 指示は必ず残す先頭の user ターンに置く。
  const turns: Array<{ role: 'user' | 'assistant'; content: string }> = [
    { role: 'user', content: buildPrompt(input) },
    ...history,
  ];
  while (turns.length > 1 && turns[turns.length - 1].role !== 'user') turns.pop();

  const { text } = await sample(turns, {
    // 会話なので毎回ちゃんと聞き直す
    cache: false,
    // 返事の速さがそのまま「会話している感じ」になるので quick
    modelTier: 'quick',
    signal,
  });
  return text;
}

async function askViaApi(input: AskInput, signal?: AbortSignal): Promise<string> {
  const res = await fetch(apiUrl('/api/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  });
  if (!res.ok) throw new Error(`chat API ${res.status}`);
  const data = await res.json();
  const text = data?.response;
  if (typeof text !== 'string' || !text.trim()) throw new Error('empty reply');
  return text;
}

/**
 * 紬に話しかける。返事の本文（<correction> ブロック込み）を返す。
 * どちらの経路も駄目なら throw するので、呼び出し側で拾うこと。
 */
export async function askTsumugi(input: AskInput, signal?: AbortSignal): Promise<string> {
  const sample = await getSample();
  // window.claude がある場所は、そもそもサーバーが無いから使っている。
  // 断られた・上限に達したときに /api/chat へ流しても同じ失敗になるので、
  // ここでの失敗はそのまま呼び出し側に返す。
  if (sample) return askViaClaude(sample, input, signal);
  return askViaApi(input, signal);
}
