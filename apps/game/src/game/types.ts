export type {
  Woordsoort,
  WordEntry,
} from '@blokwoorden/shared';

export {
  WOORDSOORTEN,
  SOORT_LABELS,
  SOORT_LABELS_SHORT,
  SOORT_COLORS,
} from '@blokwoorden/shared';

import type { Woordsoort } from '@blokwoorden/shared';

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

/** Neutrale blokkleur op het bord (woordsoort blijft verborgen tot de Taal-Check). */
export const TILE_COLOR = '#5a7a72';
export const TILE_COLOR_LIGHT = '#7a9a92';

export const COLS = 10;
export const ROWS = 20;
export const QUIZ_TIME_MS = 30000;
