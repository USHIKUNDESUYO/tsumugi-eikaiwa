import type {
  AppState,
  UserProfile,
  Message,
  SessionStats,
  MistakeRecord,
  CorrectionCard,
  ChatMode,
  BusinessScenario,
  DifficultyLevel,
  Bond,
  Streak,
  Settings,
  Outfit,
  FestivalScenarioId,
  CardProgress,
  MyAnswer,
} from '@/types';
import { scheduleNext } from './srs';

const STORAGE_KEY = 'tsumugi-app-state';
const SCHEMA_VERSION = 3;

/** 親密度レベルごとの必要ハート数 */
export const BOND_THRESHOLDS = [0, 20, 50, 100, 180, 300, 460, 680, 980, 1400];

/** レベルアップで解放される衣装 */
export const OUTFIT_UNLOCKS: Array<{ level: number; outfit: Outfit; label: string }> = [
  { level: 1, outfit: 'casual', label: 'いつもの私服' },
  { level: 2, outfit: 'hoodie', label: 'ゆるパーカー' },
  { level: 4, outfit: 'festival', label: 'フェスコーデ' },
  { level: 6, outfit: 'sauna', label: 'サウナタオル' },
  { level: 8, outfit: 'yukata', label: '浴衣' },
];

export function getDefaultProfile(): UserProfile {
  return {
    nativeLanguage: 'ja',
    displayName: '',
    currentLevel: 'elementary',
    goalLevel: 'intermediate',
    totalSessions: 0,
    onboarded: false,
  };
}

export function getDefaultBond(): Bond {
  return { points: 0, level: 1, unlockedOutfits: ['casual'], currentOutfit: 'casual' };
}

export function getDefaultStreak(): Streak {
  return { current: 0, longest: 0, totalDays: 0 };
}

export function getDefaultSettings(): Settings {
  return {
    autoSpeak: true,
    jaVoice: true,
    soundEffects: true,
    haptics: true,
    bgm: true,
    reduceMotion: false,
    sfxEnabled: true,
  };
}

export function getDefaultState(): AppState {
  return {
    profile: getDefaultProfile(),
    currentMode: 'festival',
    businessScenario: undefined,
    festivalScenario: undefined,
    businessDifficulty: 'beginner',
    messages: [],
    sessionStats: [],
    mistakes: [],
    successfulTurns: 0,
    bond: getDefaultBond(),
    streak: getDefaultStreak(),
    settings: getDefaultSettings(),
    clearedScenarios: [],
    masteredPhrases: [],
    cards: {},
    myAnswers: {},
    version: SCHEMA_VERSION,
  };
}

/** v1 (旧スキーマ) から安全に引き上げる */
function migrate(raw: Record<string, unknown>): AppState {
  const base = getDefaultState();
  const merged: AppState = {
    ...base,
    ...(raw as Partial<AppState>),
    profile: { ...base.profile, ...((raw.profile as Partial<UserProfile>) ?? {}) },
    bond: { ...base.bond, ...((raw.bond as Partial<Bond>) ?? {}) },
    streak: { ...base.streak, ...((raw.streak as Partial<Streak>) ?? {}) },
    settings: { ...base.settings, ...((raw.settings as Partial<Settings>) ?? {}) },
    clearedScenarios: (raw.clearedScenarios as FestivalScenarioId[]) ?? [],
    masteredPhrases: (raw.masteredPhrases as string[]) ?? [],
    cards: (raw.cards as Record<string, CardProgress>) ?? {},
    myAnswers: (raw.myAnswers as Record<string, MyAnswer>) ?? {},
    version: SCHEMA_VERSION,
  };

  // 旧スキーマの voiceEnabled は「読み上げを使うか」だったので autoSpeak に繋ぐ
  if (typeof raw.voiceEnabled === 'boolean') {
    merged.settings.autoSpeak = raw.voiceEnabled;
  }
  // SRS フィールドがない過去の間違い記録を初期化
  merged.mistakes = (merged.mistakes ?? []).map((m) =>
    m.dueAt === undefined ? { ...m, ...scheduleNext(m.timesMastered ?? 0, m.timestamp) } : m
  );

  return merged;
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return getDefaultState();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultState();
    return migrate(JSON.parse(stored));
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
  notify();
}

/* ------------------------------------------------------------------ */
/*  useSyncExternalStore 用の購読ストア                                  */
/*  localStorage は React の外にある状態なので、素直に外部ストアとして扱う。 */
/* ------------------------------------------------------------------ */

type Listener = () => void;
const listeners = new Set<Listener>();

/** getSnapshot は同じ内容なら同じ参照を返す必要がある（無限ループ防止） */
let cachedSnapshot: AppState | null = null;
const serverSnapshot = getDefaultState();

function notify(): void {
  cachedSnapshot = loadState();
  for (const listener of listeners) listener();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): AppState {
  if (!cachedSnapshot) cachedSnapshot = loadState();
  return cachedSnapshot;
}

export function getServerSnapshot(): AppState {
  return serverSnapshot;
}

/** 部分更新して保存し、新しい state を返す */
export function updateState(patch: (state: AppState) => void): AppState {
  const state = loadState();
  patch(state);
  saveState(state);
  return state;
}

export function updateProfile(updates: Partial<UserProfile>): AppState {
  return updateState((s) => {
    s.profile = { ...s.profile, ...updates };
  });
}

export function updateSettings(updates: Partial<Settings>): AppState {
  return updateState((s) => {
    s.settings = { ...s.settings, ...updates };
  });
}

export function saveMessages(messages: Message[]): void {
  updateState((s) => {
    s.messages = messages;
  });
}

export function clearMessages(): void {
  updateState((s) => {
    s.messages = [];
    s.successfulTurns = 0;
  });
}

export function addSessionStats(stats: SessionStats): AppState {
  return updateState((s) => {
    s.sessionStats.push(stats);
    s.profile.totalSessions += 1;
    s.profile.lastSessionDate = stats.date;
    if (s.sessionStats.length > 200) s.sessionStats = s.sessionStats.slice(-200);
  });
}

/* ---------------------------------- 親密度 --------------------------------- */

export function levelForPoints(points: number): number {
  let level = 1;
  for (let i = 0; i < BOND_THRESHOLDS.length; i++) {
    if (points >= BOND_THRESHOLDS[i]) level = i + 1;
  }
  return Math.min(level, BOND_THRESHOLDS.length);
}

export function bondProgress(bond: Bond): { current: number; next: number; ratio: number } {
  const idx = Math.min(bond.level, BOND_THRESHOLDS.length - 1);
  const floor = BOND_THRESHOLDS[bond.level - 1] ?? 0;
  const ceil = BOND_THRESHOLDS[idx] ?? floor + 1;
  if (bond.level >= BOND_THRESHOLDS.length) {
    return { current: bond.points, next: bond.points, ratio: 1 };
  }
  return {
    current: bond.points - floor,
    next: ceil - floor,
    ratio: Math.min(1, (bond.points - floor) / Math.max(1, ceil - floor)),
  };
}

export interface BondGain {
  points: number;
  leveledUp: boolean;
  newLevel: number;
  unlocked?: { outfit: Outfit; label: string };
}

export function addBondPoints(amount: number): BondGain {
  let result: BondGain = { points: 0, leveledUp: false, newLevel: 1 };
  updateState((s) => {
    const before = s.bond.level;
    s.bond.points += amount;
    s.bond.level = levelForPoints(s.bond.points);
    const leveledUp = s.bond.level > before;

    let unlocked: BondGain['unlocked'];
    if (leveledUp) {
      for (const u of OUTFIT_UNLOCKS) {
        if (u.level <= s.bond.level && !s.bond.unlockedOutfits.includes(u.outfit)) {
          s.bond.unlockedOutfits.push(u.outfit);
          unlocked = { outfit: u.outfit, label: u.label };
        }
      }
    }
    result = { points: s.bond.points, leveledUp, newLevel: s.bond.level, unlocked };
  });
  return result;
}

export function setOutfit(outfit: Outfit): void {
  updateState((s) => {
    if (s.bond.unlockedOutfits.includes(outfit)) s.bond.currentOutfit = outfit;
  });
}

/* --------------------------------- ストリーク -------------------------------- */

function todayKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function touchStreak(now = new Date()): { streak: Streak; isNewDay: boolean } {
  const today = todayKey(now);
  let isNewDay = false;
  const state = updateState((s) => {
    if (s.streak.lastActiveDate === today) return;
    isNewDay = true;

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = todayKey(yesterday);

    s.streak.current = s.streak.lastActiveDate === yKey ? s.streak.current + 1 : 1;
    s.streak.longest = Math.max(s.streak.longest, s.streak.current);
    s.streak.lastActiveDate = today;
    s.streak.totalDays += 1;
  });
  return { streak: state.streak, isNewDay };
}

/* ---------------------------------- 間違い --------------------------------- */

/** 間違いを記録して、その記録の id を返す（同じ直しが前にもあれば、その記録を出題し直す） */
export function addMistake(correction: CorrectionCard, mode: ChatMode): string {
  let id = '';
  updateState((s) => {
    const existing = s.mistakes.find(
      (m) =>
        m.said.toLowerCase().trim() === correction.said.toLowerCase().trim() &&
        m.better.toLowerCase().trim() === correction.better.toLowerCase().trim()
    );

    if (existing) {
      existing.timesSeen += 1;
      existing.lastReviewed = Date.now();
      existing.mode = mode;
      Object.assign(existing, scheduleNext(0));
      id = existing.id;
      return;
    }

    id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    s.mistakes.push({
      id,
      said: correction.said,
      better: correction.better,
      why: correction.why,
      severity: correction.severity,
      mode,
      timestamp: Date.now(),
      timesSeen: 1,
      timesMastered: 0,
      ...scheduleNext(0),
    });
  });
  return id;
}

/**
 * 会話の中で、直された文をその場で言い直せた。すぐに復習に出しても答えを覚えているだけなので、
 * 1段進めて少し寝かせる（10分後）。
 */
export function markMistakePracticed(id: string): void {
  updateState((s) => {
    const m = s.mistakes.find((x) => x.id === id);
    if (m && (m.box ?? 0) < 1) Object.assign(m, scheduleNext(1));
  });
}

export function getMistakes(): MistakeRecord[] {
  return loadState().mistakes ?? [];
}

export function updateMistake(id: string, updates: Partial<MistakeRecord>): void {
  updateState((s) => {
    const m = s.mistakes.find((x) => x.id === id);
    if (m) Object.assign(m, updates);
  });
}

export function deleteMistake(id: string): void {
  updateState((s) => {
    s.mistakes = s.mistakes.filter((m) => m.id !== id);
  });
}

/* -------------------------------- 暗記カード -------------------------------- */

/** 暗記カードに答えた。言えたら次の間隔へ、言えなかったら最初から */
export function gradeCard(key: string, correct: boolean, now = Date.now()): void {
  updateState((s) => {
    const prev = s.cards[key];
    s.cards[key] = {
      ...scheduleNext(correct ? (prev?.box ?? 0) + 1 : 0, now),
      introducedAt: prev?.introducedAt ?? now,
      lastReviewed: now,
      correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
      wrong: (prev?.wrong ?? 0) + (correct ? 0 : 1),
    };
  });
}

/** 「このカードはもういらない」。記録は残して、出題だけ止める */
export function retireCard(key: string, now = Date.now()): void {
  updateState((s) => {
    const prev = s.cards[key];
    s.cards[key] = {
      box: prev?.box ?? 0,
      dueAt: prev?.dueAt ?? now,
      introducedAt: prev?.introducedAt ?? now,
      lastReviewed: prev?.lastReviewed,
      correct: prev?.correct ?? 0,
      wrong: prev?.wrong ?? 0,
      retired: true,
    };
  });
}

/* ------------------------------ 自分の答えノート ------------------------------ */

/**
 * 自分の答えを保存する。英語が変わったら覚え直しなので、暗記カードも最初から。
 * 作った直後に一度声に出しているので、最初の出題は少し寝かせる（10分後）。
 */
export function saveMyAnswer(id: string, answer: Omit<MyAnswer, 'updatedAt'>, now = Date.now()): void {
  updateState((s) => {
    const before = s.myAnswers[id];
    s.myAnswers[id] = { ...answer, updatedAt: now };
    if (!before || before.en !== answer.en) {
      s.cards[`answer:${id}`] = { ...scheduleNext(1, now), introducedAt: now, correct: 0, wrong: 0 };
    }
  });
}

/* ------------------------------- シナリオ進行 ------------------------------- */

export function markScenarioCleared(id: FestivalScenarioId): void {
  updateState((s) => {
    if (!s.clearedScenarios.includes(id)) s.clearedScenarios.push(id);
  });
}

export function togglePhraseMastered(en: string): boolean {
  let mastered = false;
  updateState((s) => {
    const idx = s.masteredPhrases.indexOf(en);
    if (idx >= 0) {
      s.masteredPhrases.splice(idx, 1);
      mastered = false;
    } else {
      s.masteredPhrases.push(en);
      mastered = true;
    }
  });
  return mastered;
}

export function setFestivalScenario(id?: FestivalScenarioId): void {
  updateState((s) => {
    s.festivalScenario = id;
    s.currentMode = 'festival';
  });
}

export function updateBusinessSettings(scenario?: BusinessScenario, difficulty?: DifficultyLevel): void {
  updateState((s) => {
    if (scenario !== undefined) s.businessScenario = scenario;
    if (difficulty !== undefined) s.businessDifficulty = difficulty;
  });
}

export function incrementSuccessfulTurns(): void {
  updateState((s) => {
    s.successfulTurns += 1;
  });
}

export function resetSuccessfulTurns(): void {
  updateState((s) => {
    s.successfulTurns = 0;
  });
}

/** 設定画面の「データを削除」用 */
export function resetAll(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  notify();
}

/** バックアップ書き出し */
export function exportState(): string {
  return JSON.stringify(loadState(), null, 2);
}
