import type { Woordsoort } from '../game/types';
import {
  QUIZ_TIME_MS,
  SOORT_LABELS,
  SOORT_LABELS_SHORT,
  WOORDSOORTEN,
} from '../game/types';

export class QuizOverlay {
  readonly el: HTMLElement;
  private questionEl: HTMLElement;
  private wordEl: HTMLElement;
  private sentenceEl: HTMLElement;
  private buttonsEl: HTMLElement;
  private timerFill: HTMLElement;
  private progressEl: HTMLElement;
  private revealEl: HTMLElement;
  private timerId: number | null = null;
  private revealId: number | null = null;
  private onAnswer: ((soort: Woordsoort | null) => void) | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private durationMs = QUIZ_TIME_MS;
  private remainingMs = QUIZ_TIME_MS;
  private startedAt = 0;
  private paused = false;
  private revealing = false;
  private correctSoort: Woordsoort | null = null;
  private options: Woordsoort[] = [...WOORDSOORTEN];

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'quiz-overlay hidden';
    this.el.innerHTML = `
      <div class="quiz-card" role="dialog" aria-modal="true" aria-labelledby="quiz-title">
        <p class="quiz-progress" id="quiz-progress"></p>
        <h2 id="quiz-title" class="quiz-title">Taal-Check</h2>
        <p class="quiz-question">Welke woordsoort is het gemarkeerde woord?</p>
        <p class="quiz-sentence" id="quiz-sentence"></p>
        <p class="quiz-word" id="quiz-word"></p>
        <div class="quiz-timer"><div class="quiz-timer-fill"></div></div>
        <div class="quiz-buttons" role="group" aria-label="Woordsoorten"></div>
        <p class="quiz-reveal hidden" id="quiz-reveal" aria-live="polite"></p>
      </div>
    `;
    root.appendChild(this.el);

    this.questionEl = this.el.querySelector('.quiz-question')!;
    this.wordEl = this.el.querySelector('#quiz-word')!;
    this.sentenceEl = this.el.querySelector('#quiz-sentence')!;
    this.buttonsEl = this.el.querySelector('.quiz-buttons')!;
    this.timerFill = this.el.querySelector('.quiz-timer-fill')!;
    this.progressEl = this.el.querySelector('#quiz-progress')!;
    this.revealEl = this.el.querySelector('#quiz-reveal')!;

    this.renderButtons(this.options);
  }

  /** Welke antwoordopties tonen (volgorde = toetsen 1–9, 0). */
  setOptions(soorten: readonly Woordsoort[]): void {
    const next =
      soorten.length > 0
        ? WOORDSOORTEN.filter((s) => soorten.includes(s))
        : [...WOORDSOORTEN];
    this.options = next.length > 0 ? next : [...WOORDSOORTEN];
    this.renderButtons(this.options);
  }

  private renderButtons(options: readonly Woordsoort[]): void {
    this.buttonsEl.replaceChildren();
    for (let i = 0; i < options.length; i++) {
      const soort = options[i];
      const keyLabel = i === 9 ? '0' : String(i + 1);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `quiz-btn soort-${soort}`;
      btn.dataset.soort = soort;
      btn.innerHTML = `<span class="quiz-btn-key">${keyLabel}</span><span>${SOORT_LABELS_SHORT[soort]}</span>`;
      btn.addEventListener('click', () => this.submit(soort));
      this.buttonsEl.appendChild(btn);
    }
  }

  get isOpen(): boolean {
    return !this.el.classList.contains('hidden');
  }

  show(
    woord: string,
    correctSoort: Woordsoort,
    index: number,
    total: number,
    onAnswer: (soort: Woordsoort | null) => void,
    timeMs = QUIZ_TIME_MS,
    zin?: string,
  ): void {
    this.hide();
    this.onAnswer = onAnswer;
    this.correctSoort = correctSoort;
    this.paused = false;
    this.revealing = false;
    this.durationMs = timeMs;
    this.remainingMs = timeMs;

    this.revealEl.classList.add('hidden');
    this.revealEl.textContent = '';
    this.revealEl.classList.remove('ok', 'bad');
    for (const btn of this.buttonsEl.querySelectorAll('button')) {
      btn.classList.remove('is-correct', 'is-wrong', 'is-dimmed');
    }

    if (zin) {
      this.questionEl.textContent =
        'Welke woordsoort is het gemarkeerde woord?';
      this.sentenceEl.innerHTML = highlightWordInSentence(zin, woord);
      this.sentenceEl.classList.remove('hidden');
      this.wordEl.classList.add('hidden');
      this.wordEl.textContent = '';
    } else {
      this.questionEl.textContent = 'Welke woordsoort is';
      this.sentenceEl.innerHTML = '';
      this.sentenceEl.classList.add('hidden');
      this.wordEl.classList.remove('hidden');
      this.wordEl.textContent = `„${woord}”?`;
    }

    this.progressEl.textContent =
      total > 1 ? `Vraag ${index + 1} van ${total}` : 'Rij voltooid';
    this.el.classList.remove('hidden');
    this.setButtonsEnabled(true);
    this.startTimer(timeMs, 100);

    this.keyHandler = (e: KeyboardEvent) => {
      if (this.paused || this.revealing) return;
      if (e.key === '0' && this.options.length >= 10) {
        e.preventDefault();
        this.submit(this.options[9]);
        return;
      }
      const n = Number(e.key);
      if (n >= 1 && n <= 9 && n <= this.options.length) {
        e.preventDefault();
        this.submit(this.options[n - 1]);
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  pause(): void {
    if (!this.isOpen || this.paused || this.revealing) return;
    this.paused = true;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    const elapsed = performance.now() - this.startedAt;
    this.remainingMs = Math.max(0, this.remainingMs - elapsed);
    const pct = (this.remainingMs / this.durationMs) * 100;
    this.timerFill.style.transition = 'none';
    this.timerFill.style.width = `${pct}%`;
    this.setButtonsEnabled(false);
  }

  resume(): void {
    if (!this.isOpen || !this.paused || this.revealing) return;
    this.paused = false;
    this.setButtonsEnabled(true);
    if (this.remainingMs <= 0) {
      this.submit(null);
      return;
    }
    const pct = (this.remainingMs / this.durationMs) * 100;
    this.startTimer(this.remainingMs, pct);
  }

  hide(): void {
    this.clearTimer();
    this.clearReveal();
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    this.el.classList.add('hidden');
    this.onAnswer = null;
    this.correctSoort = null;
    this.paused = false;
    this.revealing = false;
    this.setButtonsEnabled(true);
  }

  private startTimer(ms: number, startPct: number): void {
    this.clearTimer();
    this.remainingMs = ms;
    this.startedAt = performance.now();
    this.timerFill.style.transition = 'none';
    this.timerFill.style.width = `${startPct}%`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.paused || this.revealing) return;
        this.timerFill.style.transition = `width ${ms}ms linear`;
        this.timerFill.style.width = '0%';
      });
    });
    this.timerId = window.setTimeout(() => this.submit(null), ms);
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private clearReveal(): void {
    if (this.revealId !== null) {
      window.clearTimeout(this.revealId);
      this.revealId = null;
    }
  }

  private setButtonsEnabled(on: boolean): void {
    for (const btn of this.buttonsEl.querySelectorAll('button')) {
      (btn as HTMLButtonElement).disabled = !on;
    }
  }

  private submit(soort: Woordsoort | null): void {
    if (this.paused || this.revealing) return;
    const correct = this.correctSoort;
    if (!correct) {
      const cb = this.onAnswer;
      this.hide();
      cb?.(soort);
      return;
    }

    this.revealing = true;
    this.clearTimer();
    this.timerFill.style.transition = 'none';
    this.setButtonsEnabled(false);

    const ok = soort !== null && soort === correct;
    for (const btn of this.buttonsEl.querySelectorAll('button')) {
      const b = btn as HTMLButtonElement;
      const s = b.dataset.soort as Woordsoort;
      if (s === correct) {
        b.classList.add('is-correct');
      } else if (soort !== null && s === soort) {
        b.classList.add('is-wrong');
      } else {
        b.classList.add('is-dimmed');
      }
    }

    this.revealEl.classList.remove('hidden', 'ok', 'bad');
    if (ok) {
      this.revealEl.classList.add('ok');
      this.revealEl.textContent = `Goed — ${SOORT_LABELS[correct]}`;
    } else if (soort === null) {
      this.revealEl.classList.add('bad');
      this.revealEl.textContent = `Tijd op — juist was: ${SOORT_LABELS[correct]}`;
    } else {
      this.revealEl.classList.add('bad');
      this.revealEl.textContent = `Fout — juist was: ${SOORT_LABELS[correct]}`;
    }

    const delay = ok ? 700 : 1600;
    const cb = this.onAnswer;
    this.revealId = window.setTimeout(() => {
      this.revealId = null;
      this.hide();
      cb?.(soort);
    }, delay);
  }
}

/** Markeert de eerste occurrence van `woord` in de zin (woordgrenzen). */
export function highlightWordInSentence(zin: string, woord: string): string {
  const escaped = woord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|[^\\p{L}])(${escaped})(?=[^\\p{L}]|$)`, 'iu');
  const match = re.exec(zin);
  if (!match) {
    return `${escapeHtml(zin)} <span class="quiz-mark">„${escapeHtml(woord)}”</span>`;
  }
  const before = zin.slice(0, match.index + match[1].length);
  const hit = match[2];
  const after = zin.slice(match.index + match[0].length);
  return `${escapeHtml(before)}<mark class="quiz-mark">${escapeHtml(hit)}</mark>${escapeHtml(after)}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
