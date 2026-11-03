import type { WordEntry, Woordsoort } from './types';
import { WOORDSOORTEN } from './types';

export interface Settings {
  quizTimeMs: number;
  showGhost: boolean;
  alwaysTouch: boolean;
  startLevel: number;
}

export interface Stats {
  gamesPlayed: number;
  totalScore: number;
  totalLines: number;
  correctAnswers: number;
  wrongAnswers: number;
  perfectMatches: number;
  grammarChains: number;
  wallsCreated: number;
}

export interface Records {
  highScore: number;
  mostLines: number;
  highestLevel: number;
  bestMultiplier: number;
  bestPerfectInGame: number;
  topScores: ScoreEntry[];
}

export interface ScoreEntry {
  score: number;
  lines: number;
  level: number;
  date: string;
}

export interface MistakeEntry {
  woord: string;
  soort: Woordsoort;
  wrongCount: number;
  /** Correct answers after being marked as a mistake (mastery progress). */
  recoveredCount: number;
  lastWrongAt: string;
  /** How often each wrong choice / timeout was picked. */
  byChoice: Partial<Record<Woordsoort | 'timeout', number>>;
}

export interface SessionStats {
  correctAnswers: number;
  wrongAnswers: number;
  perfectMatches: number;
  grammarChains: number;
  wallsCreated: number;
  bestMultiplier: number;
}

const KEY = 'blokwoorden-v1';
export const PRACTICE_MIN_WORDS = 12;

interface Persist {
  settings: Settings;
  stats: Stats;
  records: Records;
  mistakes: MistakeEntry[];
}

const DEFAULT_SETTINGS: Settings = {
  quizTimeMs: 30000,
  showGhost: true,
  alwaysTouch: false,
  startLevel: 1,
};

const DEFAULT_STATS: Stats = {
  gamesPlayed: 0,
  totalScore: 0,
  totalLines: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  perfectMatches: 0,
  grammarChains: 0,
  wallsCreated: 0,
};

const DEFAULT_RECORDS: Records = {
  highScore: 0,
  mostLines: 0,
  highestLevel: 0,
  bestMultiplier: 1,
  bestPerfectInGame: 0,
  topScores: [],
};

function load(): Persist {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return {
        settings: { ...DEFAULT_SETTINGS },
        stats: { ...DEFAULT_STATS },
        records: { ...DEFAULT_RECORDS, topScores: [] },
        mistakes: [],
      };
    }
    const parsed = JSON.parse(raw) as Partial<Persist>;
    return {
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      stats: { ...DEFAULT_STATS, ...parsed.stats },
      records: {
        ...DEFAULT_RECORDS,
        ...parsed.records,
        topScores: parsed.records?.topScores ?? [],
      },
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
    };
  } catch {
    return {
      settings: { ...DEFAULT_SETTINGS },
      stats: { ...DEFAULT_STATS },
      records: { ...DEFAULT_RECORDS, topScores: [] },
      mistakes: [],
    };
  }
}

function save(data: Persist): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

const QUIZ_TIME_OPTIONS = new Set([20000, 25000, 30000, 40000]);

export function getSettings(): Settings {
  const settings = { ...load().settings };
  if (!QUIZ_TIME_OPTIONS.has(settings.quizTimeMs)) {
    settings.quizTimeMs = DEFAULT_SETTINGS.quizTimeMs;
  }
  return settings;
}

export function saveSettings(partial: Partial<Settings>): Settings {
  const data = load();
  data.settings = { ...data.settings, ...partial };
  save(data);
  return { ...data.settings };
}

export function getStats(): Stats {
  return { ...load().stats };
}

export function getRecords(): Records {
  const r = load().records;
  return { ...r, topScores: [...r.topScores] };
}

export function getMistakes(): MistakeEntry[] {
  return load()
    .mistakes.map((m) => ({
      ...m,
      byChoice: { ...m.byChoice },
    }))
    .sort((a, b) => b.wrongCount - a.wrongCount || a.woord.localeCompare(b.woord));
}

/** Active mistakes still worth practicing (more wrongs than recoveries). */
export function getActiveMistakes(): MistakeEntry[] {
  return getMistakes().filter((m) => m.wrongCount > m.recoveredCount);
}

export function mistakeCountBySoort(): Record<Woordsoort, number> {
  const counts = Object.fromEntries(
    WOORDSOORTEN.map((s) => [s, 0]),
  ) as Record<Woordsoort, number>;
  for (const m of getActiveMistakes()) {
    counts[m.soort] += 1;
  }
  return counts;
}

export function recordWrongAnswer(
  woord: string,
  soort: Woordsoort,
  chosen: Woordsoort | null,
): void {
  const data = load();
  // Direct bijwerken — anders tellen afgebroken spellen niet mee.
  data.stats.wrongAnswers += 1;
  data.stats.wallsCreated += 1;

  let entry = data.mistakes.find((m) => m.woord === woord);
  if (!entry) {
    entry = {
      woord,
      soort,
      wrongCount: 0,
      recoveredCount: 0,
      lastWrongAt: '',
      byChoice: {},
    };
    data.mistakes.push(entry);
  }
  entry.soort = soort;
  entry.wrongCount += 1;
  entry.lastWrongAt = new Date().toISOString();
  const key = chosen ?? 'timeout';
  entry.byChoice[key] = (entry.byChoice[key] ?? 0) + 1;
  save(data);
}

/** Correct quiz answer: bump stats + progress toward clearing a mistake. */
export function recordCorrectAnswer(woord: string): void {
  const data = load();
  data.stats.correctAnswers += 1;
  const entry = data.mistakes.find((m) => m.woord === woord);
  if (entry && entry.wrongCount > entry.recoveredCount) {
    entry.recoveredCount += 1;
  }
  save(data);
}

export function clearMistakes(): void {
  const data = load();
  data.mistakes = [];
  save(data);
}

/**
 * Build a word pool for practice mode: all active mistakes first,
 * padded with extra words from the full list if below minSize.
 */
export function buildPracticePool(
  allWords: WordEntry[],
  minSize = PRACTICE_MIN_WORDS,
): { pool: WordEntry[]; fromMistakes: number; padded: number } {
  const active = getActiveMistakes();
  const seen = new Set<string>();
  const pool: WordEntry[] = [];

  for (const m of active) {
    if (seen.has(m.woord)) continue;
    seen.add(m.woord);
    const fromList = allWords.find((w) => w.woord === m.woord);
    pool.push({
      woord: m.woord,
      soort: m.soort,
      zin: fromList?.zin,
    });
  }

  const fromMistakes = pool.length;
  const fillers = allWords.filter((w) => !seen.has(w.woord));
  shuffleInPlace(fillers);

  while (pool.length < minSize && fillers.length > 0) {
    const w = fillers.pop()!;
    seen.add(w.woord);
    pool.push(w);
  }

  // If still short (tiny word list), allow duplicates from mistakes/all
  while (pool.length < minSize && allWords.length > 0) {
    pool.push(allWords[pool.length % allWords.length]);
  }

  shuffleInPlace(pool);
  return {
    pool,
    fromMistakes,
    padded: pool.length - fromMistakes,
  };
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function emptySession(): SessionStats {
  return {
    correctAnswers: 0,
    wrongAnswers: 0,
    perfectMatches: 0,
    grammarChains: 0,
    wallsCreated: 0,
    bestMultiplier: 1,
  };
}

export function recordGameEnd(
  score: number,
  lines: number,
  level: number,
  session: SessionStats,
): { isHighScore: boolean; records: Records } {
  const data = load();
  data.stats.gamesPlayed += 1;
  data.stats.totalScore += score;
  data.stats.totalLines += lines;
  data.stats.perfectMatches += session.perfectMatches;
  data.stats.grammarChains += session.grammarChains;

  const isHighScore = score > data.records.highScore;
  data.records.highScore = Math.max(data.records.highScore, score);
  data.records.mostLines = Math.max(data.records.mostLines, lines);
  data.records.highestLevel = Math.max(data.records.highestLevel, level);
  data.records.bestMultiplier = Math.max(
    data.records.bestMultiplier,
    session.bestMultiplier,
  );
  data.records.bestPerfectInGame = Math.max(
    data.records.bestPerfectInGame,
    session.perfectMatches,
  );

  const entry: ScoreEntry = {
    score,
    lines,
    level,
    date: new Date().toISOString(),
  };
  data.records.topScores = [...data.records.topScores, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  save(data);
  return { isHighScore, records: getRecords() };
}

export function resetStatsAndRecords(): void {
  const data = load();
  data.stats = { ...DEFAULT_STATS };
  data.records = { ...DEFAULT_RECORDS, topScores: [] };
  save(data);
}
