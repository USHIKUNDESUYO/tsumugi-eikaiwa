export type LanguageLevel = 'elementary' | 'intermediate' | 'business';

export type ChatMode = 
  | 'free-chat'
  | 'daily-life'
  | 'travel'
  | 'workplace-small-talk'
  | 'meeting'
  | 'email'
  | 'presentation'
  | 'vocab-drill';

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

export interface AppState {
  profile: UserProfile;
  currentMode: ChatMode;
  messages: Message[];
  sessionStats: SessionStats[];
  voiceEnabled: boolean;
}
