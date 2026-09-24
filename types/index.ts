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

/** 紬の表情。キャラクターSVGと感情ロジックの共通言語。 */
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
  | 'love';

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
  voiceEnabled: boolean;
  autoSpeak: boolean;
  showFurigana: boolean;
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
  /** スキーマバージョン（マイグレーション用） */
  version: number;
}
