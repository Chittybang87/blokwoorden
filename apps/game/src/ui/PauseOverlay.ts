export type PauseAction = 'resume' | 'menu';

export class PauseOverlay {
  readonly el: HTMLElement;
  private onAction: ((action: PauseAction) => void) | null = null;

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'menu-overlay pause-overlay hidden';
    this.el.innerHTML = `
      <div class="menu-card pause-card" role="dialog" aria-modal="true" aria-labelledby="pause-title">
        <p class="hud-eyebrow">Even rust</p>
        <h2 id="pause-title" class="menu-title">Pauze</h2>
        <p class="menu-lead">Het spel staat stil. Je kunt verdergaan of terug naar het startscherm.</p>
        <div class="start-actions">
          <button type="button" class="primary-btn" data-pause="resume">Hervatten</button>
          <button type="button" class="secondary-btn" data-pause="menu">Naar startscherm</button>
        </div>
        <p class="menu-hint">Tip: Escape of P om te pauzeren / hervatten</p>
      </div>
    `;
    root.appendChild(this.el);

    this.el.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-pause]');
      if (!btn) return;
      const action = btn.getAttribute('data-pause') as PauseAction;
      this.onAction?.(action);
    });
  }

  setHandler(handler: (action: PauseAction) => void): void {
    this.onAction = handler;
  }

  show(): void {
    this.el.classList.remove('hidden');
  }

  hide(): void {
    this.el.classList.add('hidden');
  }

  get visible(): boolean {
    return !this.el.classList.contains('hidden');
  }
}
