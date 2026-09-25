import type { LanguageLevel } from '@/types';
import type { AnswerQuestion } from './answerQuestions';
import { askTsumugi } from './chatTransport';

export interface CoachedAnswer {
  en: string;
  ja: string;
  tip: string;
}

/**
 * 下書き（日本語でも英語でも）を、口に出して言える英語の答えにしてもらう。
 * 作れなかったとき（AI に繋がらない・形が崩れた）は throw する。
 */
export async function coachAnswer(
  question: AnswerQuestion,
  draft: string,
  level: LanguageLevel,
  userName?: string
): Promise<CoachedAnswer> {
  const raw = await askTsumugi({
    messages: [{ role: 'user', content: draft }],
    mode: 'festival',
    level,
    userName,
    coach: { en: question.en, ja: question.ja },
  });
  // 前後に説明やコードブロックが付いても拾えるよう、最初の { から最後の } までを読む
  const json = raw.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error('no answer');
  const parsed = JSON.parse(json) as Partial<CoachedAnswer>;
  const en = typeof parsed.en === 'string' ? parsed.en.trim() : '';
  if (!en) throw new Error('empty answer');
  return {
    en,
    ja: typeof parsed.ja === 'string' ? parsed.ja.trim() : '',
    tip: typeof parsed.tip === 'string' ? parsed.tip.trim() : '',
  };
}
