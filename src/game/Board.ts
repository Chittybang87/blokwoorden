import type { Cell, LineInfo } from './types';
import { COLS, ROWS } from './types';
import type { Piece } from './Piece';

function emptyCell(): Cell {
  return {
    filled: false,
    indestructible: false,
    woord: null,
    soort: null,
    lockId: 0,
  };
}

export class Board {
  grid: Cell[][];
  private nextLockId = 1;

  constructor() {
    this.grid = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => emptyCell()),
    );
  }

  reset(): void {
    this.grid = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => emptyCell()),
    );
    this.nextLockId = 1;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < COLS && y >= 0 && y < ROWS;
  }

  isFree(x: number, y: number): boolean {
    if (!this.inBounds(x, y)) return false;
    return !this.grid[y][x].filled;
  }

  fits(piece: Piece, dx = 0, dy = 0, rot?: number): boolean {
    return piece.cells(rot ?? piece.rotation).every(({ x, y }) => {
      const nx = x + dx;
      const ny = y + dy;
      if (ny < 0) return nx >= 0 && nx < COLS;
      return this.isFree(nx, ny);
    });
  }

  lock(piece: Piece): number {
    const lockId = this.nextLockId++;
    for (const { x, y } of piece.cells()) {
      if (!this.inBounds(x, y)) continue;
      this.grid[y][x] = {
        filled: true,
        indestructible: false,
        woord: piece.woord,
        soort: piece.soort,
        lockId,
      };
    }
    return lockId;
  }

  /** Full rows that are not gray walls, bottom → top. */
  findFullLines(): number[] {
    const rows: number[] = [];
    for (let y = ROWS - 1; y >= 0; y--) {
      if (this.isClearableFullRow(y)) rows.push(y);
    }
    return rows;
  }

  isClearableFullRow(y: number): boolean {
    const row = this.grid[y];
    if (row.some((c) => c.indestructible)) return false;
    return row.every((c) => c.filled);
  }

  isWallRow(y: number): boolean {
    return this.grid[y].every((c) => c.filled && c.indestructible);
  }

  /** Dominant word = highest lockId on the row. */
  getLineInfo(row: number): LineInfo | null {
    let best: Cell | null = null;
    for (const cell of this.grid[row]) {
      if (!cell.filled || !cell.woord || !cell.soort) continue;
      if (!best || cell.lockId > best.lockId) best = cell;
    }
    if (!best || !best.woord || !best.soort) return null;
    return { row, woord: best.woord, soort: best.soort };
  }

  makeWall(row: number): void {
    for (let x = 0; x < COLS; x++) {
      this.grid[row][x] = {
        filled: true,
        indestructible: true,
        woord: null,
        soort: null,
        lockId: 0,
      };
    }
  }

  clearRows(rows: number[]): void {
    const remove = new Set(rows);
    const kept: Cell[][] = [];
    for (let y = 0; y < ROWS; y++) {
      if (!remove.has(y)) kept.push(this.grid[y]);
    }
    while (kept.length < ROWS) {
      kept.unshift(Array.from({ length: COLS }, () => emptyCell()));
    }
    this.grid = kept;
  }

  isGameOverSpawnBlocked(piece: Piece): boolean {
    return !this.fits(piece);
  }
}

export function ghostY(board: Board, piece: Piece): number {
  let dy = 0;
  while (board.fits(piece, 0, dy + 1)) dy++;
  return piece.y + dy;
}
