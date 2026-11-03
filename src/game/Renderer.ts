import { Board, ghostY } from './Board';
import type { Piece } from './Piece';
import {
  COLS,
  ROWS,
  TILE_COLOR,
  TILE_COLOR_LIGHT,
} from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private cell = 32;
  private pad = 8;
  highlightRows = new Set<number>();
  flashWallRow: number | null = null;
  flashClearRows = new Set<number>();

  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas niet beschikbaar');
    this.ctx = ctx;
    this.resize();
  }

  resize(): void {
    const maxW = Math.min(420, window.innerWidth - 32);
    const maxH = Math.min(window.innerHeight * 0.62, 640);
    this.cell = Math.floor(
      Math.min((maxW - this.pad * 2) / COLS, (maxH - this.pad * 2) / ROWS),
    );
    const w = this.cell * COLS + this.pad * 2;
    const h = this.cell * ROWS + this.pad * 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  showGhost = true;

  draw(board: Board, active: Piece | null): void {
    const { ctx, cell, pad } = this;
    const w = cell * COLS + pad * 2;
    const h = cell * ROWS + pad * 2;

    ctx.clearRect(0, 0, w, h);

    // Lined notebook field
    ctx.fillStyle = '#e7eef2';
    roundRect(ctx, 0, 0, w, h, 16);
    ctx.fill();

    ctx.strokeStyle = '#c5d4dc';
    ctx.lineWidth = 1;
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(pad, pad + y * cell);
      ctx.lineTo(pad + COLS * cell, pad + y * cell);
      ctx.stroke();
    }
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(pad + x * cell, pad);
      ctx.lineTo(pad + x * cell, pad + ROWS * cell);
      ctx.stroke();
    }

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const c = board.grid[y][x];
        if (!c.filled) continue;
        if (c.indestructible) {
          this.drawWall(x, y);
        } else if (c.filled) {
          this.drawTile(x, y, c.woord, false);
        }
      }
    }

    for (const row of this.highlightRows) {
      ctx.fillStyle = 'rgba(61, 107, 140, 0.22)';
      ctx.fillRect(pad, pad + row * cell, COLS * cell, cell);
    }

    for (const row of this.flashClearRows) {
      ctx.fillStyle = 'rgba(63, 143, 110, 0.35)';
      ctx.fillRect(pad, pad + row * cell, COLS * cell, cell);
    }

    if (this.flashWallRow !== null) {
      ctx.fillStyle = 'rgba(80, 80, 80, 0.4)';
      ctx.fillRect(pad, pad + this.flashWallRow * cell, COLS * cell, cell);
    }

    if (active) {
      if (this.showGhost) {
        const gy = ghostY(board, active);
        const ghost = active.clone();
        ghost.y = gy;
        for (const { x, y } of ghost.cells()) {
          if (y < 0) continue;
          this.drawTile(x, y, null, true);
        }
      }
      for (const { x, y } of active.cells()) {
        if (y < 0) continue;
        this.drawTile(x, y, active.woord, false);
      }
    }
  }

  private drawTile(
    x: number,
    y: number,
    woord: string | null,
    ghost: boolean,
  ): void {
    const { ctx, cell, pad } = this;
    const px = pad + x * cell;
    const py = pad + y * cell;
    const inset = 2;
    const r = Math.max(4, cell * 0.18);

    if (ghost) {
      ctx.globalAlpha = 0.28;
    }

    const grad = ctx.createLinearGradient(px, py, px, py + cell);
    grad.addColorStop(0, TILE_COLOR_LIGHT);
    grad.addColorStop(1, TILE_COLOR);
    ctx.fillStyle = grad;
    roundRect(ctx, px + inset, py + inset, cell - inset * 2, cell - inset * 2, r);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Wood-ish edge
    ctx.strokeStyle = 'rgba(30, 40, 36, 0.25)';
    ctx.lineWidth = 1;
    roundRect(ctx, px + inset, py + inset, cell - inset * 2, cell - inset * 2, r);
    ctx.stroke();

    if (woord && !ghost) {
      ctx.fillStyle = '#fffdf8';
      ctx.font = `700 ${Math.max(8, cell * 0.28)}px Nunito, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = woord.length > 7 ? woord.slice(0, 6) + '…' : woord;
      ctx.fillText(label, px + cell / 2, py + cell / 2);
    }

    ctx.globalAlpha = 1;
  }

  private drawWall(x: number, y: number): void {
    const { ctx, cell, pad } = this;
    const px = pad + x * cell;
    const py = pad + y * cell;
    const inset = 2;
    const r = Math.max(3, cell * 0.12);

    ctx.fillStyle = '#6b6f72';
    roundRect(ctx, px + inset, py + inset, cell - inset * 2, cell - inset * 2, r);
    ctx.fill();

    ctx.fillStyle = '#56595c';
    ctx.fillRect(px + inset + 3, py + inset + 3, cell - inset * 2 - 6, 3);
    ctx.fillRect(px + inset + 3, py + cell / 2 - 1, cell - inset * 2 - 6, 3);

    ctx.strokeStyle = '#3d4043';
    ctx.lineWidth = 1.5;
    roundRect(ctx, px + inset, py + inset, cell - inset * 2, cell - inset * 2, r);
    ctx.stroke();

    ctx.fillStyle = 'rgba(20,20,20,0.55)';
    ctx.font = `800 ${Math.max(10, cell * 0.35)}px Nunito, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('×', px + cell / 2, py + cell / 2 + 1);
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
