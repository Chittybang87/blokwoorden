export type Woordsoort =
  | 'zelfstandig'
  | 'lidwoord'
  | 'bijvoeglijk'
  | 'voornaamwoord'
  | 'bijwoord'
  | 'telwoord'
  | 'voegwoord'
  | 'voorzetsel'
  | 'tussenwerpsel'
  | 'werkwoord';

/** Volgorde zoals in de theorie / oefenbundel. */
export const WOORDSOORTEN: Woordsoort[] = [
  'zelfstandig',
  'lidwoord',
  'bijvoeglijk',
  'voornaamwoord',
  'bijwoord',
  'telwoord',
  'voegwoord',
  'voorzetsel',
  'tussenwerpsel',
  'werkwoord',
];

export interface WordEntry {
  woord: string;
  soort: Woordsoort;
  /** Voorbeeldzin uit de oefenbundel (woord in context). */
  zin?: string;
}

export interface Cell {
  filled: boolean;
  indestructible: boolean;
  woord: string | null;
  soort: Woordsoort | null;
  lockId: number;
}

export type GameState = 'menu' | 'playing' | 'quiz' | 'paused' | 'gameover';

export interface LineInfo {
  row: number;
  woord: string;
  soort: Woordsoort;
}

export const SOORT_LABELS: Record<Woordsoort, string> = {
  zelfstandig: 'Zelfstandig naamwoord',
  lidwoord: 'Lidwoord',
  bijvoeglijk: 'Bijvoeglijk naamwoord',
  voornaamwoord: 'Voornaamwoord',
  bijwoord: 'Bijwoord',
  telwoord: 'Telwoord',
  voegwoord: 'Voegwoord',
  voorzetsel: 'Voorzetsel',
  tussenwerpsel: 'Tussenwerpsel',
  werkwoord: 'Werkwoord',
};

/** Korte labels voor quizknoppen en legenda. */
export const SOORT_LABELS_SHORT: Record<Woordsoort, string> = {
  zelfstandig: 'Zelfst. nw.',
  lidwoord: 'Lidwoord',
  bijvoeglijk: 'Bijv. nw.',
  voornaamwoord: 'Voornaamw.',
  bijwoord: 'Bijwoord',
  telwoord: 'Telwoord',
  voegwoord: 'Voegwoord',
  voorzetsel: 'Voorzetsel',
  tussenwerpsel: 'Tussenwerp.',
  werkwoord: 'Werkwoord',
};

export const SOORT_COLORS: Record<Woordsoort, string> = {
  zelfstandig: '#3d6b8c',
  lidwoord: '#c9a227',
  bijvoeglijk: '#3f8f6e',
  voornaamwoord: '#6b4f8a',
  bijwoord: '#c47a3a',
  telwoord: '#2a8a8a',
  voegwoord: '#8b5a3c',
  voorzetsel: '#4a6fa5',
  tussenwerpsel: '#b85c7a',
  werkwoord: '#c45c48',
};

export const SOORT_COLORS_LIGHT: Record<Woordsoort, string> = {
  zelfstandig: '#6a9bb8',
  lidwoord: '#e0c04a',
  bijvoeglijk: '#6bb894',
  voornaamwoord: '#9a7eb8',
  bijwoord: '#e09a5a',
  telwoord: '#4abab0',
  voegwoord: '#b07a5a',
  voorzetsel: '#7a9bc5',
  tussenwerpsel: '#d88aa4',
  werkwoord: '#e07a68',
};

export const COLS = 10;
export const ROWS = 20;
export const QUIZ_TIME_MS = 30000;
