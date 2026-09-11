import { AppState, UserProfile, Message, SessionStats, MistakeRecord, CorrectionCard, ChatMode, BusinessScenario, DifficultyLevel } from '@/types';

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
    businessScenario: undefined,
    businessDifficulty: 'beginner',
    messages: [],
    sessionStats: [],
    voiceEnabled: false,
    mistakes: [],
    successfulTurns: 0,
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

export function addMistake(correction: CorrectionCard, mode: ChatMode): void {
  const state = loadState();
  
  // Check if this mistake already exists (same said/better pair)
  const existing = state.mistakes.find(
    m => m.said.toLowerCase() === correction.said.toLowerCase() && 
         m.better.toLowerCase() === correction.better.toLowerCase()
  );
  
  if (existing) {
    // Update existing mistake
    existing.timesSeen += 1;
    existing.lastReviewed = Date.now();
    existing.mode = mode; // Update to latest mode
  } else {
    // Add new mistake
    const newMistake: MistakeRecord = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      said: correction.said,
      better: correction.better,
      why: correction.why,
      severity: correction.severity,
      mode,
      timestamp: Date.now(),
      timesSeen: 1,
      timesMastered: 0,
    };
    state.mistakes.push(newMistake);
  }
  
  saveState(state);
}

export function getMistakes(): MistakeRecord[] {
  const state = loadState();
  return state.mistakes || [];
}

export function updateMistake(id: string, updates: Partial<MistakeRecord>): void {
  const state = loadState();
  const mistake = state.mistakes.find(m => m.id === id);
  
  if (mistake) {
    Object.assign(mistake, updates);
    saveState(state);
  }
}

export function deleteMistake(id: string): void {
  const state = loadState();
  state.mistakes = state.mistakes.filter(m => m.id !== id);
  saveState(state);
}

export function markMistakeMastered(id: string): void {
  const state = loadState();
  const mistake = state.mistakes.find(m => m.id === id);
  
  if (mistake) {
    mistake.timesMastered += 1;
    mistake.lastReviewed = Date.now();
    saveState(state);
  }
}

export function getMistakesSortedForReview(): MistakeRecord[] {
  const mistakes = getMistakes();
  
  // Sort by: least mastered first, then newest first
  return mistakes.sort((a, b) => {
    const masteryDiff = a.timesMastered - b.timesMastered;
    if (masteryDiff !== 0) return masteryDiff;
    
    // If same mastery level, newer mistakes first
    return b.timestamp - a.timestamp;
  });
}

export function updateBusinessSettings(scenario?: BusinessScenario, difficulty?: DifficultyLevel): void {
  const state = loadState();
  if (scenario !== undefined) state.businessScenario = scenario;
  if (difficulty !== undefined) state.businessDifficulty = difficulty;
  saveState(state);
}

export function incrementSuccessfulTurns(): void {
  const state = loadState();
  state.successfulTurns += 1;
  saveState(state);
}

export function resetSuccessfulTurns(): void {
  const state = loadState();
  state.successfulTurns = 0;
  saveState(state);
}
