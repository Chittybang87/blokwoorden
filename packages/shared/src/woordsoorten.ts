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

export interface WordRow extends WordEntry {
  id: string;
  active: boolean;
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

/**
 * Palet voor quizknoppen / theorie (gespiegeld in CSS).
 * Speelblokken gebruiken TILE_COLOR — geen spoiler van de woordsoort.
 */
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

export const WOORDSOORT_SQL_LIST = WOORDSOORTEN.map((s) => `'${s}'`).join(', ');
