import { AppState, UserProfile, Message, SessionStats } from '@/types';

const STORAGE_KEY = 'tsumugi-app-state';

export function getDefaultProfile(): UserProfile {
  return {
    nativeLanguage: 'ja',
    currentLevel: 'elementary',
    goalLevel: 'business',
    totalSessions: 0,
  };
}

export function getDefaultState(): AppState {
  return {
    profile: getDefaultProfile(),
    currentMode: 'free-chat',
    messages: [],
    sessionStats: [],
    voiceEnabled: false,
  };
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return getDefaultState();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultState();
    
    const parsed = JSON.parse(stored);
    return { ...getDefaultState(), ...parsed };
  } catch (error) {
    console.error('Failed to load state:', error);
    return getDefaultState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

export function addSessionStats(stats: SessionStats): void {
  const state = loadState();
  state.sessionStats.push(stats);
  state.profile.totalSessions += 1;
  state.profile.lastSessionDate = stats.date;
  saveState(state);
}

export function updateProfile(updates: Partial<UserProfile>): void {
  const state = loadState();
  state.profile = { ...state.profile, ...updates };
  saveState(state);
}

export function saveMessages(messages: Message[]): void {
  const state = loadState();
  state.messages = messages;
  saveState(state);
}

export function clearMessages(): void {
  const state = loadState();
  state.messages = [];
  saveState(state);
}
