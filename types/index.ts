import type { FestivalScenarioId } from '@/lib/festivalScenarios';

export type { FestivalScenarioId };

export type LanguageLevel = 'elementary' | 'intermediate' | 'business';

export type ChatMode =
  | 'free-chat'
  | 'daily-life'
  | 'travel'
  | 'workplace-small-talk'
  | 'meeting'
  | 'email'
  | 'presentation'
  | 'vocab-drill'
  | 'business'
  | 'festival';

export type BusinessScenario =
  | 'meeting-basics'
  | 'email-tone'
  | 'presentation-qa'
  | 'small-talk-work'
  | 'negotiation'
  | 'phone-video'
  | 'difficult-clients'
  | 'status-updates'
  | 'one-on-one-feedback'
  | 'networking'
  | 'timezone-scheduling';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * 紬の表情とポーズ。
 * 後半5つは体の動きを伴うカットで、場面の節目（挨拶・ほめる・訂正・
 * お願い・照れ）で使う。表情と同じ仕組みに乗せておくと扱いが楽になる。
 */
export type Expression =
  | 'neutral'
  | 'smile'
  | 'happy'
  | 'shy'
  | 'surprised'
  | 'thinking'
  | 'sad'
  | 'wink'
  | 'sleepy'
  | 'love'
  | 'wave'
  | 'cheer'
  | 'point'
  | 'plead'
  | 'hide';

/** 解放できる衣装 */
export type Outfit = 'casual' | 'festival' | 'yukata' | 'hoodie' | 'sauna';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  correction?: CorrectionCard;
  /** このメッセージを喋ったときの紬の表情 */
  expression?: Expression;
  /** 相手の返事の日本語訳（「訳」を押したときだけ見せる） */
  translation?: string;
  /** 添削を記録した間違いの id（言い直せたら復習の予定を動かす） */
  mistakeId?: string;
}

export interface CorrectionCard {
  said: string;
  better: string;
  why: string;
  severity: 'minor' | 'moderate' | 'important';
}

export interface MistakeRecord {
  id: string;
  said: string;
  better: string;
  why: string;
  severity: 'minor' | 'moderate' | 'important';
  mode: ChatMode;
  timestamp: number;
  timesSeen: number;
  timesMastered: number;
  lastReviewed?: number;
  /** SRS: 次に出題する時刻 (epoch ms) */
  dueAt?: number;
  /** SRS: 現在の間隔インデックス */
  box?: number;
}

/**
 * フレーズなどの暗記カードの進み具合（会話で直された間違いの記録とは別に持つ）。
 * キーは「phrase:<英文>」「answer:<質問の id>」。
 */
export interface CardProgress {
  /** SRS: 現在の間隔インデックス */
  box: number;
  /** SRS: 次に出題する時刻 (epoch ms) */
  dueAt: number;
  /** 初めて答えた時刻。1日に出す新しいカードの数を数える */
  introducedAt: number;
  lastReviewed?: number;
  correct: number;
  wrong: number;
  /** 「このカードはもういらない」 */
  retired?: boolean;
}

/** フェスで必ず聞かれる質問への、自分の答え（lib/answerQuestions.ts の id ごと） */
export interface MyAnswer {
  /** 本人が書いた下書き（日本語でも英語でも） */
  draft: string;
  /** 紬と一緒に作った英語 */
  en: string;
  /** その英語の日本語訳 */
  ja: string;
  /** 覚えるときのひとこと */
  tip?: string;
  updatedAt: number;
}

export interface UserProfile {
  nativeLanguage: 'ja';
  displayName: string;
  currentLevel: LanguageLevel;
  goalLevel: LanguageLevel;
  totalSessions: number;
  lastSessionDate?: string;
  /** オンボーディング完了フラグ */
  onboarded: boolean;
}

export interface SessionStats {
  messagesCount: number;
  correctionsCount: number;
  duration: number;
  mode: ChatMode;
  scenarioId?: FestivalScenarioId;
  date: string;
}

export interface Phrase {
  english: string;
  japanese: string;
  context?: string;
}

export interface BusinessScenarioInfo {
  id: BusinessScenario;
  label: string;
  description: string;
  emoji: string;
  phrases: Phrase[];
}

/** 紬との親密度。萌えの中核。 */
export interface Bond {
  /** 累積ハート */
  points: number;
  /** 現在のレベル (1..10) */
  level: number;
  /** 解放済み衣装 */
  unlockedOutfits: Outfit[];
  /** 現在着ている衣装 */
  currentOutfit: Outfit;
}

/** 連続学習日数 */
export interface Streak {
  current: number;
  longest: number;
  /** YYYY-MM-DD */
  lastActiveDate?: string;
  /** 今日すでにカウント済みか判定用 */
  totalDays: number;
}

export interface Settings {
  /** 英語の返答を自動で読み上げるか */
  autoSpeak: boolean;
  /** 紬の日本語ボイスを鳴らすか */
  jaVoice: boolean;
  /** UIの効果音を鳴らすか */
  soundEffects: boolean;
  /** 触覚フィードバックを出すか */
  haptics: boolean;
  /** BGMを流すか */
  bgm: boolean;
  reduceMotion: boolean;
  sfxEnabled: boolean;
}

export interface AppState {
  profile: UserProfile;
  currentMode: ChatMode;
  businessScenario?: BusinessScenario;
  festivalScenario?: FestivalScenarioId;
  businessDifficulty: DifficultyLevel;
  messages: Message[];
  sessionStats: SessionStats[];
  mistakes: MistakeRecord[];
  successfulTurns: number;
  bond: Bond;
  streak: Streak;
  settings: Settings;
  /** クリア済みフェスシナリオ */
  clearedScenarios: FestivalScenarioId[];
  /** 暗記済み必修フレーズ (en をキーに) */
  masteredPhrases: string[];
  /** 暗記カードの進み具合 */
  cards: Record<string, CardProgress>;
  /** 自分の答えノート */
  myAnswers: Record<string, MyAnswer>;
  /** スキーマバージョン（マイグレーション用） */
  version: number;
}
