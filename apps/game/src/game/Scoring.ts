export function baseLinePoints(lineCount: number, level: number): number {
  const table: Record<number, number> = {
    1: 100,
    2: 300,
    3: 500,
    4: 800,
  };
  return (table[lineCount] ?? lineCount * 200) * level;
}

export function perfectMatchBonus(pairCount: number, level: number): number {
  return pairCount * 500 * level;
}

export function softDropPoints(cells: number): number {
  return cells;
}

export function hardDropPoints(cells: number): number {
  return cells * 2;
}

/** +10 per opeenvolgende juiste lijn vanaf de 2e. */
export function streakExtraPoints(streak: number): number {
  return streak >= 2 ? 10 : 0;
}
