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
  | 'business'; // New umbrella mode

export type BusinessScenario =
  | 'meeting-basics'
  | 'email-tone'
  | 'presentation-qa'
  | 'small-talk-work'
  | 'negotiation'
  | 'phone-video';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  correction?: CorrectionCard;
}

export interface CorrectionCard {
  said: string;
  better: string;
  why: string; // in Japanese
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
}

export interface UserProfile {
  nativeLanguage: 'ja';
  currentLevel: LanguageLevel;
  goalLevel: LanguageLevel;
  totalSessions: number;
  lastSessionDate?: string;
}

export interface SessionStats {
  messagesCount: number;
  correctionsCount: number;
  duration: number; // milliseconds
  mode: ChatMode;
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

export interface AppState {
  profile: UserProfile;
  currentMode: ChatMode;
  businessScenario?: BusinessScenario;
  businessDifficulty: DifficultyLevel;
  messages: Message[];
  sessionStats: SessionStats[];
  voiceEnabled: boolean;
  mistakes: MistakeRecord[];
  successfulTurns: number; // For scaffolding
}
