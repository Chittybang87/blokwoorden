export type ComboKind = 'perfect' | 'chain' | 'streak';

export class ComboPopup {
  readonly el: HTMLElement;
  private kickerEl: HTMLElement;
  private titleEl: HTMLElement;
  private multiEl: HTMLElement;
  private subEl: HTMLElement;
  private particlesEl: HTMLElement;
  private hideTimer: number | null = null;
  private onDone: (() => void) | null = null;

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'combo-overlay hidden';
    this.el.innerHTML = `
      <div class="combo-burst" aria-live="polite">
        <div class="combo-particles" aria-hidden="true"></div>
        <p class="combo-kicker">Combo!</p>
        <h2 class="combo-title"></h2>
        <p class="combo-multi"></p>
        <p class="combo-sub"></p>
      </div>
    `;
    root.appendChild(this.el);
    this.kickerEl = this.el.querySelector('.combo-kicker')!;
    this.titleEl = this.el.querySelector('.combo-title')!;
    this.multiEl = this.el.querySelector('.combo-multi')!;
    this.subEl = this.el.querySelector('.combo-sub')!;
    this.particlesEl = this.el.querySelector('.combo-particles')!;
  }

  show(
    kind: ComboKind,
    opts: {
      multiplier?: number;
      bonus?: number;
      streak?: number;
      detail?: string;
    },
    onDone?: () => void,
  ): void {
    this.clearTimer();
    this.onDone = onDone ?? null;

    this.el.classList.remove('kind-perfect', 'kind-chain', 'kind-streak');
    this.el.classList.add(`kind-${kind}`);
    this.kickerEl.textContent = kind === 'streak' ? 'Reeks!' : 'Combo!';

    if (kind === 'perfect') {
      this.titleEl.textContent = 'Perfect Match';
      this.multiEl.textContent = opts.bonus ? `+${opts.bonus}` : 'Bonus!';
      this.subEl.textContent =
        opts.detail ?? 'Grammaticaal paar — zonder vraag weggeveegd';
    } else if (kind === 'streak') {
      const s = opts.streak ?? 2;
      this.titleEl.textContent = `${s} op een rij!`;
      this.multiEl.textContent = opts.bonus ? `+${opts.bonus}` : 'Bonus!';
      this.subEl.textContent =
        opts.detail ?? 'Juiste lijnen achter elkaar — streak-bonus';
    } else {
      const m = opts.multiplier ?? 2;
      this.titleEl.textContent = 'Grammatica-Chain';
      this.multiEl.textContent = `×${m}`;
      this.subEl.textContent =
        opts.detail ?? 'Alle woordsoorten goed — multiplier actief';
    }

    this.spawnParticles();
    this.el.classList.remove('hidden');
    void this.el.offsetWidth;
    this.el.classList.add('combo-show');

    this.hideTimer = window.setTimeout(() => this.hide(), 1700);
  }

  hide(): void {
    this.clearTimer();
    this.el.classList.remove('combo-show');
    this.el.classList.add('hidden');
    const cb = this.onDone;
    this.onDone = null;
    cb?.();
  }

  private clearTimer(): void {
    if (this.hideTimer !== null) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  private spawnParticles(): void {
    this.particlesEl.innerHTML = '';
    const colors = ['#c9a227', '#3f8f6e', '#3d6b8c', '#c45c48', '#f3f7f5'];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('span');
      p.className = 'combo-particle';
      const angle = (i / 18) * Math.PI * 2;
      const dist = 60 + Math.random() * 90;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      p.style.setProperty('--c', colors[i % colors.length]);
      p.style.animationDelay = `${Math.random() * 0.12}s`;
      this.particlesEl.appendChild(p);
    }
  }
}
