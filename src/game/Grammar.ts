import type { LineInfo, Woordsoort } from './types';

/** Top-to-bottom pairs that auto-clear (Perfect Match). */
const PERFECT_PAIRS: Array<[Woordsoort, Woordsoort]> = [
  ['bijvoeglijk', 'zelfstandig'],
  ['lidwoord', 'zelfstandig'],
  ['lidwoord', 'bijvoeglijk'],
  ['telwoord', 'zelfstandig'],
  ['voorzetsel', 'zelfstandig'],
  ['voorzetsel', 'lidwoord'],
  ['voornaamwoord', 'werkwoord'],
  ['bijwoord', 'werkwoord'],
  ['werkwoord', 'bijwoord'],
];

/** Known sentence-like chains (top → bottom), used for combo multiplier. */
const CHAINS: Woordsoort[][] = [
  ['bijvoeglijk', 'zelfstandig'],
  ['lidwoord', 'zelfstandig'],
  ['lidwoord', 'bijvoeglijk'],
  ['telwoord', 'zelfstandig'],
  ['voorzetsel', 'zelfstandig'],
  ['voornaamwoord', 'werkwoord'],
  ['lidwoord', 'bijvoeglijk', 'zelfstandig'],
  ['voorzetsel', 'lidwoord', 'zelfstandig'],
  ['telwoord', 'bijvoeglijk', 'zelfstandig'],
  ['voornaamwoord', 'werkwoord', 'bijwoord'],
  ['werkwoord', 'lidwoord', 'zelfstandig'],
  ['werkwoord', 'bijvoeglijk', 'zelfstandig'],
  ['lidwoord', 'zelfstandig', 'werkwoord'],
  ['voornaamwoord', 'werkwoord', 'voorzetsel', 'zelfstandig'],
];

export function isPerfectPair(above: Woordsoort, below: Woordsoort): boolean {
  return PERFECT_PAIRS.some(([a, b]) => a === above && b === below);
}

/**
 * Among completed lines (already sorted bottom→top by row desc),
 * find adjacent Perfect Match pairs. Rows are screen-top = smaller index.
 * Returns row indices to auto-clear (no quiz).
 */
export function findPerfectMatchRows(lines: LineInfo[]): number[] {
  if (lines.length < 2) return [];

  // Sort top → bottom (ascending row)
  const sorted = [...lines].sort((a, b) => a.row - b.row);
  const matched = new Set<number>();

  for (let i = 0; i < sorted.length - 1; i++) {
    const above = sorted[i];
    const below = sorted[i + 1];
    if (below.row !== above.row + 1) continue;
    if (isPerfectPair(above.soort, below.soort)) {
      matched.add(above.row);
      matched.add(below.row);
    }
  }

  return [...matched];
}

/** Returns multiplier 2/3/4 if kinds (top→bottom) form a grammar chain, else 1. */
export function grammarChainMultiplier(kindsTopToBottom: Woordsoort[]): number {
  if (kindsTopToBottom.length < 2) return 1;

  const hit = CHAINS.some(
    (chain) =>
      chain.length === kindsTopToBottom.length &&
      chain.every((k, i) => k === kindsTopToBottom[i]),
  );

  if (!hit) return 1;
  if (kindsTopToBottom.length >= 4) return 4;
  if (kindsTopToBottom.length === 3) return 3;
  return 2;
}
