import type { Piece } from '../game/Piece';

export class Hud {
  readonly el: HTMLElement;
  private scoreEl: HTMLElement;
  private levelEl: HTMLElement;
  private linesEl: HTMLElement;
  private comboEl: HTMLElement;
  private nextWordEl: HTMLElement;
  private nextCardEl: HTMLElement;
  private modeBadgeEl: HTMLElement | null = null;

  onPause: (() => void) | null = null;

  constructor(root: HTMLElement) {
    this.el = document.createElement('aside');
    this.el.className = 'hud-panel';
    this.el.innerHTML = `
      <div class="hud-brand">
        <p class="hud-eyebrow">Woordenschat-puzzel</p>
        <h1 class="hud-title">Blokwoorden</h1>
      </div>
      <div class="hud-actions">
        <button type="button" class="hud-menu-btn" id="hud-pause">Pauze</button>
      </div>
      <p class="mode-badge hidden" id="mode-badge">Oefenmodus</p>
      <div class="hud-stat">
        <span class="hud-label">Score</span>
        <span class="hud-value" id="hud-score">0</span>
      </div>
      <div class="hud-row">
        <div class="hud-stat compact">
          <span class="hud-label">Niveau</span>
          <span class="hud-value" id="hud-level">1</span>
        </div>
        <div class="hud-stat compact">
          <span class="hud-label">Rijen</span>
          <span class="hud-value" id="hud-lines">0</span>
        </div>
      </div>
      <div class="hud-combo hidden" id="hud-combo"></div>
      <div class="hud-next">
        <span class="hud-label">Volgende woordkaart</span>
        <div class="next-card" id="next-card">
          <span class="next-word" id="next-word">—</span>
        </div>
      </div>
      <div class="hud-tips">
        <p class="hud-label">Tip</p>
        <p class="hud-tip-text">Vul een rij om de woordsoort te raden. Bij een fout zie je het juiste antwoord.</p>
      </div>
    `;
    root.appendChild(this.el);

    this.scoreEl = this.el.querySelector('#hud-score')!;
    this.levelEl = this.el.querySelector('#hud-level')!;
    this.linesEl = this.el.querySelector('#hud-lines')!;
    this.comboEl = this.el.querySelector('#hud-combo')!;
    this.nextWordEl = this.el.querySelector('#next-word')!;
    this.nextCardEl = this.el.querySelector('#next-card')!;
    this.modeBadgeEl = this.el.querySelector('#mode-badge');

    this.el.querySelector('#hud-pause')!.addEventListener('click', () => {
      this.onPause?.();
    });
  }

  setPracticeMode(on: boolean, detail?: string): void {
    if (!this.modeBadgeEl) return;
    this.modeBadgeEl.classList.toggle('hidden', !on);
    this.modeBadgeEl.textContent = detail ?? 'Oefenmodus';
  }

  update(score: number, level: number, lines: number): void {
    this.scoreEl.textContent = String(score);
    this.levelEl.textContent = String(level);
    this.linesEl.textContent = String(lines);
  }

  setNext(piece: Piece | null): void {
    if (!piece) {
      this.nextWordEl.textContent = '—';
      this.nextCardEl.style.background = '#5a6e68';
      return;
    }
    this.nextWordEl.textContent = piece.woord;
    this.nextCardEl.style.background = '#5a7a72';
  }

  flashCombo(text: string): void {
    this.comboEl.textContent = text;
    this.comboEl.classList.remove('hidden', 'pop');
    void this.comboEl.offsetWidth;
    this.comboEl.classList.add('pop');
    window.setTimeout(() => this.comboEl.classList.add('hidden'), 1800);
  }
}
