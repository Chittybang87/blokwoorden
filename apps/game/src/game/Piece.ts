import type { WordEntry, Woordsoort } from './types';
import { COLS } from './types';

/** Relative cell offsets for each shape id and rotation (0-3). */
const SHAPES: Record<string, number[][][]> = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  O: [
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]],
  ],
};

export const SHAPE_IDS = Object.keys(SHAPES);

export class Piece {
  shapeId: string;
  rotation = 0;
  x: number;
  y: number;
  woord: string;
  soort: Woordsoort;

  constructor(shapeId: string, word: WordEntry) {
    this.shapeId = shapeId;
    this.woord = word.woord;
    this.soort = word.soort;
    this.x = Math.floor(COLS / 2) - 2;
    this.y = 0;
  }

  cells(rot = this.rotation): { x: number; y: number }[] {
    return SHAPES[this.shapeId][rot % 4].map(([dx, dy]) => ({
      x: this.x + dx,
      y: this.y + dy,
    }));
  }

  clone(): Piece {
    const p = new Piece(this.shapeId, { woord: this.woord, soort: this.soort });
    p.rotation = this.rotation;
    p.x = this.x;
    p.y = this.y;
    return p;
  }
}

export function randomShapeId(bag: string[]): string {
  if (bag.length === 0) {
    bag.push(...SHAPE_IDS);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  return bag.pop()!;
}
