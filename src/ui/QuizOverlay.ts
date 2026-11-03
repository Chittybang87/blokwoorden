import type { Woordsoort } from '../game/types';
import {
  QUIZ_TIME_MS,
  SOORT_LABELS_SHORT,
  WOORDSOORTEN,
} from '../game/types';

const OPTIONS = WOORDSOORTEN;

export class QuizOverlay {
  readonly el: HTMLElement;
  private questionEl: HTMLElement;
  private wordEl: HTMLElement;
  private sentenceEl: HTMLElement;
  private buttonsEl: HTMLElement;
  private timerFill: HTMLElement;
  private progressEl: HTMLElement;
  private timerId: number | null = null;
  private onAnswer: ((soort: Woordsoort | null) => void) | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private durationMs = QUIZ_TIME_MS;
  private remainingMs = QUIZ_TIME_MS;
  private startedAt = 0;
  private paused = false;

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
      </div>
    `;
    root.appendChild(this.el);

    this.questionEl = this.el.querySelector('.quiz-question')!;
    this.wordEl = this.el.querySelector('#quiz-word')!;
    this.sentenceEl = this.el.querySelector('#quiz-sentence')!;
    this.buttonsEl = this.el.querySelector('.quiz-buttons')!;
    this.timerFill = this.el.querySelector('.quiz-timer-fill')!;
    this.progressEl = this.el.querySelector('#quiz-progress')!;

    for (let i = 0; i < OPTIONS.length; i++) {
      const soort = OPTIONS[i];
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
    index: number,
    total: number,
    onAnswer: (soort: Woordsoort | null) => void,
    timeMs = QUIZ_TIME_MS,
    zin?: string,
  ): void {
    this.hide();
    this.onAnswer = onAnswer;
    this.paused = false;
    this.durationMs = timeMs;
    this.remainingMs = timeMs;

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
      if (this.paused) return;
      if (e.key === '0') {
        e.preventDefault();
        this.submit(OPTIONS[9]);
        return;
      }
      const n = Number(e.key);
      if (n >= 1 && n <= 9) {
        e.preventDefault();
        this.submit(OPTIONS[n - 1]);
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  pause(): void {
    if (!this.isOpen || this.paused) return;
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
    if (!this.isOpen || !this.paused) return;
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
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    this.el.classList.add('hidden');
    this.onAnswer = null;
    this.paused = false;
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
        if (this.paused) return;
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

  private setButtonsEnabled(on: boolean): void {
    for (const btn of this.buttonsEl.querySelectorAll('button')) {
      (btn as HTMLButtonElement).disabled = !on;
    }
  }

  private submit(soort: Woordsoort | null): void {
    if (this.paused) return;
    const cb = this.onAnswer;
    this.hide();
    cb?.(soort);
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
