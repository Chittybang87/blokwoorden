import { ComboPopup } from '../ui/ComboPopup';
import { Hud } from '../ui/Hud';
import { PauseOverlay } from '../ui/PauseOverlay';
import { QuizOverlay } from '../ui/QuizOverlay';
import { StartScreen } from '../ui/StartScreen';
import { getCachedContent, loadGameContent } from '../online/content';
import { submitGroupScore } from '../online/groups';
import { Board } from './Board';
import { findPerfectMatchRows, grammarChainMultiplier } from './Grammar';
import { Input, type InputAction } from './Input';
import { Piece, randomShapeId } from './Piece';
import { Renderer } from './Renderer';
import {
  baseLinePoints,
  hardDropPoints,
  perfectMatchBonus,
  softDropPoints,
  streakExtraPoints,
} from './Scoring';
import {
  buildPracticePool,
  emptySession,
  filterWordsByEnabledSoorten,
  getSettings,
  recordCorrectAnswer,
  recordGameEnd,
  recordWrongAnswer,
  type SessionStats,
  type Settings,
} from './Storage';
import type { GameState, LineInfo, WordEntry, Woordsoort } from './types';
import { SOORT_LABELS } from './types';

export type PlayMode = 'normal' | 'practice';

interface QuizGroup {
  woord: string;
  soort: Woordsoort;
  rows: number[];
}

interface PendingQuiz {
  /** Unieke vragen (zelfde woord over meerdere rijen = één vraag). */
  groups: QuizGroup[];
  /** Alle lijnen (voor grammatica-chain / clear), gesorteerd onder→boven. */
  lines: LineInfo[];
  index: number;
  results: boolean[];
  perfectRows: number[];
}

export class Game {
  private board = new Board();
  private renderer: Renderer;
  private input = new Input();
  private hud: Hud;
  private quiz: QuizOverlay;
  private startScreen: StartScreen;
  private comboPopup: ComboPopup;
  private pauseOverlay: PauseOverlay;
  private touchBar: HTMLElement;
  private shell: HTMLElement;
  private stopTouchHolds: Array<() => void> = [];

  private state: GameState = 'menu';
  private resumeState: GameState = 'playing';
  private active: Piece | null = null;
  private next: Piece | null = null;
  private bag: string[] = [];
  private score = 0;
  private level = 1;
  private linesCleared = 0;
  /** Opeenvolgende juiste lijnen (quiz of perfect match). */
  private correctStreak = 0;
  /** Opgebouwde streak-bonus tijdens de huidige quiz. */
  private pendingStreakBonus = 0;
  private dropMs = 800;
  private dropAcc = 0;
  private lastTs = 0;
  private raf = 0;
  private pending: PendingQuiz | null = null;
  private session: SessionStats = emptySession();
  private settings: Settings = getSettings();
  private playMode: PlayMode = 'normal';
  private allWords: WordEntry[] = getCachedContent().words;
  private wordPool: WordEntry[] = this.allWords;
  private overEl: HTMLElement;
  private feedbackEl: HTMLElement;

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <div class="shell">
        <header class="mobile-brand">
          <p class="hud-eyebrow">Woordenschat-puzzel</p>
          <h1 class="hud-title">Blokwoorden</h1>
        </header>
        <div class="play-column">
          <canvas id="board" aria-label="Speelveld"></canvas>
          <div class="touch-bar" id="touch-bar">
            <button type="button" data-act="left" aria-label="Links">◀</button>
            <button type="button" data-act="rotate" aria-label="Draaien">↻</button>
            <button type="button" data-act="softDrop" aria-label="Omlaag">▼</button>
            <button type="button" data-act="hardDrop" aria-label="Direct neer">⬇</button>
            <button type="button" data-act="right" aria-label="Rechts">▶</button>
            <button type="button" data-act="pause" aria-label="Pauze" class="touch-pause">❚❚</button>
          </div>
        </div>
        <div class="side-column" id="side"></div>
        <div class="menu-overlay hidden" id="gameover">
          <div class="menu-card">
            <h2 class="menu-title">Einde</h2>
            <p class="menu-lead" id="final-score">Score: 0</p>
            <p class="record-banner hidden" id="record-banner">Nieuw record!</p>
            <div class="stat-grid session-answer-stats" id="session-answer-stats"></div>
            <div class="session-mistakes hidden" id="session-mistakes">
              <h3 class="panel-subtitle">Fouten deze sessie</h3>
              <ul class="mistake-list" id="session-mistake-list"></ul>
            </div>
            <div class="start-actions">
              <button type="button" class="primary-btn" id="again-btn">Opnieuw</button>
              <button type="button" class="secondary-btn hidden" id="show-mistakes-btn">
                Toon fouten
              </button>
              <button type="button" class="secondary-btn" id="to-menu-btn">Startscherm</button>
            </div>
          </div>
        </div>
        <div class="feedback-toast hidden" id="feedback"></div>
      </div>
    `;

    this.shell = root.querySelector('.shell') as HTMLElement;
    const canvas = root.querySelector('#board') as HTMLCanvasElement;
    const side = root.querySelector('#side') as HTMLElement;
    this.touchBar = root.querySelector('#touch-bar') as HTMLElement;
    this.renderer = new Renderer(canvas);
    this.hud = new Hud(side);
    this.quiz = new QuizOverlay(this.shell);
    this.comboPopup = new ComboPopup(this.shell);
    this.pauseOverlay = new PauseOverlay(this.shell);
    this.startScreen = new StartScreen(this.shell);
    this.overEl = root.querySelector('#gameover')!;
    this.feedbackEl = root.querySelector('#feedback')!;

    this.startScreen.setHandler((action) => {
      if (action === 'newGame') this.start('normal');
      if (action === 'practiceGame') this.start('practice');
      if (action === 'settingsChanged') this.applySettings();
    });

    void this.refreshContent();

    this.pauseOverlay.setHandler((action) => {
      if (action === 'resume') this.resume();
      if (action === 'menu') this.quitToMenu(true);
    });

    this.hud.onPause = () => this.togglePause();

    root.querySelector('#again-btn')!.addEventListener('click', () =>
      this.start(this.playMode),
    );
    root.querySelector('#to-menu-btn')!.addEventListener('click', () => {
      this.overEl.classList.add('hidden');
      this.openMenu();
    });
    root.querySelector('#show-mistakes-btn')!.addEventListener('click', () => {
      this.toggleSessionMistakes();
    });

    this.bindTouch(this.touchBar);
    const onViewportResize = (): void => {
      this.renderer.resize();
      this.draw();
    };
    window.addEventListener('resize', onViewportResize);
    window.visualViewport?.addEventListener('resize', onViewportResize);
    window.addEventListener('keydown', this.onGlobalKey);

    this.input.setHandler((a) => this.onAction(a));
    this.input.setEnabled(false);
    this.applySettings();
    this.openMenu();
    this.draw();
  }

  private onGlobalKey = (e: KeyboardEvent): void => {
    if (e.code !== 'Escape' && e.code !== 'KeyP') return;
    if (this.state === 'menu' || this.state === 'gameover') return;
    // Don't steal P while typing isn't relevant; block when quiz number keys matter — P/Escape ok
    if (this.startScreen.el && !this.startScreen.el.classList.contains('hidden')) {
      return;
    }
    e.preventDefault();
    this.togglePause();
  };

  private openMenu(): void {
    this.state = 'menu';
    this.input.setEnabled(false);
    this.active = null;
    this.quiz.hide();
    this.comboPopup.hide();
    this.pauseOverlay.hide();
    this.overEl.classList.add('hidden');
    this.startScreen.show();
  }

  private togglePause(): void {
    if (this.state === 'paused') {
      this.resume();
      return;
    }
    if (this.state === 'playing' || this.state === 'quiz') {
      this.pause();
    }
  }

  private pause(): void {
    if (this.state !== 'playing' && this.state !== 'quiz') return;
    this.resumeState = this.state;
    this.state = 'paused';
    this.input.setEnabled(false);
    if (this.resumeState === 'quiz') this.quiz.pause();
    this.pauseOverlay.show();
  }

  private resume(): void {
    if (this.state !== 'paused') return;
    this.pauseOverlay.hide();
    this.state = this.resumeState;
    if (this.state === 'playing') {
      this.input.setEnabled(true);
      this.dropAcc = 0;
      this.lastTs = performance.now();
      if (!this.raf) this.raf = requestAnimationFrame(this.loop);
    } else if (this.state === 'quiz') {
      this.quiz.resume();
      this.lastTs = performance.now();
      if (!this.raf) this.raf = requestAnimationFrame(this.loop);
    }
  }

  private quitToMenu(fromPause = false): void {
    if (!fromPause && this.state !== 'playing' && this.state !== 'quiz' && this.state !== 'paused') {
      this.openMenu();
      return;
    }
    if (!confirm('Spel afbreken en terug naar het startscherm?')) {
      return;
    }
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.pending = null;
    this.quiz.hide();
    this.comboPopup.hide();
    this.pauseOverlay.hide();
    this.openMenu();
  }

  private applySettings(): void {
    this.settings = getSettings();
    this.renderer.showGhost = this.settings.showGhost;
    this.shell.classList.toggle('always-touch', this.settings.alwaysTouch);
    this.quiz.setOptions(this.settings.enabledSoorten);
    this.renderer.resize();
    this.draw();
  }

  private bindTouch(bar: HTMLElement): void {
    const map: Record<string, InputAction> = {
      left: 'left',
      right: 'right',
      rotate: 'rotate',
      softDrop: 'softDrop',
      hardDrop: 'hardDrop',
    };

    for (const btn of bar.querySelectorAll('button')) {
      const raw = btn.getAttribute('data-act') ?? '';
      if (raw === 'pause') {
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.togglePause();
        });
        continue;
      }

      const act = map[raw];
      if (!act) continue;

      let holdId: number | null = null;
      const fire = () => this.input.trigger(act);
      const stop = () => {
        if (holdId !== null) {
          window.clearInterval(holdId);
          holdId = null;
        }
      };
      this.stopTouchHolds.push(stop);

      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        fire();
        if (act === 'left' || act === 'right' || act === 'softDrop') {
          holdId = window.setInterval(fire, act === 'softDrop' ? 45 : 70);
        }
      });
      btn.addEventListener('pointerup', stop);
      btn.addEventListener('pointercancel', stop);
      btn.addEventListener('lostpointercapture', stop);
    }
  }

  private async refreshContent(): Promise<void> {
    const content = await loadGameContent();
    this.allWords = content.words;
    if (this.state === 'menu') {
      this.wordPool = this.allWords;
    }
    this.startScreen.setTheoryHtml(content.theoryHtml);
  }

  private catalogWords(): WordEntry[] {
    return this.allWords.length > 0 ? this.allWords : getCachedContent().words;
  }

  start(mode: PlayMode = 'normal'): void {
    cancelAnimationFrame(this.raf);
    this.applySettings();
    this.playMode = mode;

    const catalog = this.catalogWords();
    const activeWords = filterWordsByEnabledSoorten(
      catalog,
      this.settings.enabledSoorten,
    );

    if (mode === 'practice') {
      const built = buildPracticePool(activeWords);
      this.wordPool = built.pool;
      this.hud.setPracticeMode(
        true,
        `Oefenmodus · ${built.fromMistakes} fouten${
          built.padded > 0 ? ` + ${built.padded} extra` : ''
        }`,
      );
      this.toast(
        built.padded > 0
          ? `Oefenmodus: ${built.fromMistakes} fouten + ${built.padded} extra woorden`
          : `Oefenmodus: ${built.fromMistakes} fouten`,
      );
    } else {
      this.wordPool = activeWords.length > 0 ? activeWords : catalog;
      this.hud.setPracticeMode(false);
      if (this.settings.enabledSoorten.length < 10) {
        this.toast(
          `${this.settings.enabledSoorten.length} woordsoort${
            this.settings.enabledSoorten.length === 1 ? '' : 'en'
          } actief`,
        );
      }
    }

    this.board.reset();
    this.score = 0;
    this.level = this.settings.startLevel;
    this.linesCleared = (this.level - 1) * 10;
    this.correctStreak = 0;
    this.pendingStreakBonus = 0;
    this.updateLevel();
    this.dropAcc = 0;
    this.bag = [];
    this.pending = null;
    this.session = emptySession();
    this.renderer.highlightRows.clear();
    this.renderer.flashClearRows.clear();
    this.renderer.flashWallRow = null;
    this.quiz.hide();
    this.comboPopup.hide();
    this.pauseOverlay.hide();
    this.startScreen.hide();
    this.overEl.classList.add('hidden');
    this.next = this.spawnPiece();
    this.active = this.spawnPiece();
    this.hud.setNext(this.next);
    this.hud.update(this.score, this.level, this.linesCleared);
    this.state = 'playing';
    this.resumeState = 'playing';
    this.input.setEnabled(true);
    this.lastTs = performance.now();
    this.loop(this.lastTs);
  }

  private spawnPiece(): Piece {
    const shape = randomShapeId(this.bag);
    const word = this.wordPool[Math.floor(Math.random() * this.wordPool.length)];
    return new Piece(shape, word);
  }

  private loop = (ts: number): void => {
    const dt = ts - this.lastTs;
    this.lastTs = ts;

    if (this.state === 'playing' && this.active) {
      this.dropAcc += dt;
      while (this.dropAcc >= this.dropMs) {
        this.dropAcc -= this.dropMs;
        this.tryMove(0, 1);
      }
    }

    this.draw();
    if (
      this.state === 'playing' ||
      this.state === 'quiz' ||
      this.state === 'paused'
    ) {
      this.raf = requestAnimationFrame(this.loop);
    } else {
      this.raf = 0;
    }
  };

  private onAction(action: InputAction): void {
    if (this.state !== 'playing' || !this.active) return;
    switch (action) {
      case 'left':
        this.tryMove(-1, 0);
        break;
      case 'right':
        this.tryMove(1, 0);
        break;
      case 'softDrop':
        if (this.tryMove(0, 1)) this.addScore(softDropPoints(1));
        break;
      case 'hardDrop': {
        if (!this.active) return;
        let n = 0;
        while (this.board.fits(this.active, 0, 1)) {
          this.active.y += 1;
          n++;
        }
        this.addScore(hardDropPoints(n));
        this.lockActive();
        break;
      }
      case 'rotate':
        this.tryRotate(1);
        break;
      case 'rotateCCW':
        this.tryRotate(-1);
        break;
    }
  }

  private tryMove(dx: number, dy: number): boolean {
    if (!this.active) return false;
    if (!this.board.fits(this.active, dx, dy)) {
      if (dy > 0) this.lockActive();
      return false;
    }
    this.active.x += dx;
    this.active.y += dy;
    return true;
  }

  private tryRotate(dir: number): void {
    if (!this.active) return;
    const nextRot = (this.active.rotation + dir + 4) % 4;
    const kicks = [0, -1, 1, -2, 2];
    for (const k of kicks) {
      if (this.board.fits(this.active, k, 0, nextRot)) {
        this.active.rotation = nextRot;
        this.active.x += k;
        return;
      }
    }
  }

  private lockActive(): void {
    if (!this.active) return;
    this.board.lock(this.active);
    this.active = null;
    this.input.setEnabled(false);
    for (const stop of this.stopTouchHolds) stop();
    this.resolveLines();
  }

  private resolveLines(): void {
    const full = this.board.findFullLines();
    if (full.length === 0) {
      this.afterClear();
      return;
    }

    const infos: LineInfo[] = [];
    for (const row of full) {
      const info = this.board.getLineInfo(row);
      if (info) infos.push(info);
    }

    const perfectRows = findPerfectMatchRows(infos);
    if (perfectRows.length > 0) {
      this.renderer.flashClearRows = new Set(perfectRows);
      const pairs = perfectRows.length / 2;
      const bonus = pairs * 500 * this.level;
      const streakBonus = this.registerCorrectLines(perfectRows.length);
      this.addScore(perfectMatchBonus(pairs, this.level) + streakBonus);
      this.linesCleared += perfectRows.length;
      this.updateLevel();
      this.session.perfectMatches += pairs;
      this.hud.flashCombo(
        streakBonus > 0
          ? `Perfect Match! +${bonus} · Reeks +${streakBonus}`
          : `Perfect Match! +${bonus}`,
      );

      this.comboPopup.show(
        'perfect',
        {
          bonus: bonus + streakBonus,
          detail:
            pairs > 1
              ? `${pairs} grammaticale paren tegelijk`
              : 'Grammaticaal paar — zonder vraag weggeveegd',
        },
        () => {
          this.board.clearRows(perfectRows);
          this.renderer.flashClearRows.clear();

          const remaining = this.board
            .findFullLines()
            .map((r) => this.board.getLineInfo(r))
            .filter((x): x is LineInfo => !!x);

          if (remaining.length === 0) {
            this.afterClear();
          } else {
            this.beginQuiz(remaining, []);
          }
        },
      );
      return;
    }

    this.beginQuiz(infos, []);
  }

  private beginQuiz(lines: LineInfo[], perfectRows: number[]): void {
    const sorted = [...lines].sort((a, b) => b.row - a.row);
    this.pending = {
      groups: groupQuizLines(sorted),
      lines: sorted,
      index: 0,
      results: [],
      perfectRows,
    };
    this.state = 'quiz';
    this.renderer.highlightRows = new Set(sorted.map((l) => l.row));
    this.askNext();
  }

  private askNext(): void {
    if (!this.pending) return;
    const { groups, index } = this.pending;
    if (index >= groups.length) {
      this.finishQuiz();
      return;
    }
    const group = groups[index];
    this.renderer.highlightRows = new Set(group.rows);
    const zin =
      this.wordPool.find((w) => w.woord === group.woord)?.zin ??
      this.catalogWords().find((w) => w.woord === group.woord)?.zin;
    this.quiz.show(
      group.woord,
      group.soort,
      index,
      groups.length,
      (answer) => this.onQuizAnswer(answer),
      this.settings.quizTimeMs,
      zin,
    );
  }

  private onQuizAnswer(answer: Woordsoort | null): void {
    if (!this.pending) return;
    const group = this.pending.groups[this.pending.index];
    const ok = answer !== null && answer === group.soort;
    this.pending.results.push(ok);

    if (ok) {
      this.session.correctAnswers += 1;
      this.pendingStreakBonus += this.registerCorrectLines(group.rows.length);
      recordCorrectAnswer(group.woord);
    } else {
      this.correctStreak = 0;
      this.session.wrongAnswers += 1;
      this.session.wallsCreated += group.rows.length;
      this.session.mistakes.push({
        woord: group.woord,
        soort: group.soort,
        chosen: answer,
      });
      recordWrongAnswer(group.woord, group.soort, answer);
      for (const row of group.rows) {
        this.board.makeWall(row);
      }
      this.renderer.flashWallRow = group.rows[0] ?? null;
      window.setTimeout(() => {
        this.renderer.flashWallRow = null;
      }, 400);
    }

    this.pending.index++;
    window.setTimeout(() => this.askNext(), 120);
  }

  private finishQuiz(): void {
    if (!this.pending) return;
    const { lines, groups, results } = this.pending;
    this.quiz.hide();
    this.renderer.highlightRows.clear();

    const clearRows: number[] = [];
    for (let i = 0; i < groups.length; i++) {
      if (results[i]) clearRows.push(...groups[i].rows);
    }

    const streakBonus = this.pendingStreakBonus;
    this.pendingStreakBonus = 0;

    let multiplier = 1;
    if (clearRows.length >= 2 && results.every(Boolean)) {
      const topToBottom = [...lines]
        .sort((a, b) => a.row - b.row)
        .map((l) => l.soort);
      multiplier = grammarChainMultiplier(topToBottom);
    }

    const applyClear = (): void => {
      if (clearRows.length > 0) {
        const pts =
          baseLinePoints(clearRows.length, this.level) * multiplier +
          streakBonus;
        this.addScore(pts);
        this.linesCleared += clearRows.length;
        this.updateLevel();
        this.renderer.flashClearRows = new Set(clearRows);
        window.setTimeout(() => {
          this.board.clearRows(clearRows);
          this.renderer.flashClearRows.clear();
          this.pending = null;
          this.afterClear();
        }, 280);
      } else {
        this.pending = null;
        this.afterClear();
      }
    };

    if (multiplier > 1) {
      this.session.grammarChains += 1;
      this.session.bestMultiplier = Math.max(
        this.session.bestMultiplier,
        multiplier,
      );
      this.hud.flashCombo(
        streakBonus > 0
          ? `Grammatica-Chain ×${multiplier} · Reeks +${streakBonus}`
          : `Grammatica-Chain ×${multiplier}`,
      );
      this.comboPopup.show(
        'chain',
        {
          multiplier,
          detail:
            streakBonus > 0
              ? `${clearRows.length} rijen · reeks-bonus +${streakBonus}`
              : `${clearRows.length} rijen · alle woordsoorten goed`,
        },
        applyClear,
      );
      return;
    }

    if (streakBonus > 0 && this.correctStreak >= 2) {
      this.hud.flashCombo(`Reeks ×${this.correctStreak}! +${streakBonus}`);
      this.comboPopup.show(
        'streak',
        {
          streak: this.correctStreak,
          bonus: streakBonus,
          detail: `${this.correctStreak} juiste lijnen achter elkaar`,
        },
        applyClear,
      );
      return;
    }

    applyClear();
  }

  /** Verhoogt de juiste-lijn-reeks en geeft +10 per treffer vanaf de 2e. */
  private registerCorrectLines(count: number): number {
    let bonus = 0;
    for (let i = 0; i < count; i++) {
      this.correctStreak += 1;
      bonus += streakExtraPoints(this.correctStreak);
    }
    return bonus;
  }

  private afterClear(): void {
    this.hud.update(this.score, this.level, this.linesCleared);
    this.active = this.next;
    this.next = this.spawnPiece();
    this.hud.setNext(this.next);

    if (!this.active || this.board.isGameOverSpawnBlocked(this.active)) {
      this.gameOver();
      return;
    }

    this.state = 'playing';
    this.input.setEnabled(true);
    this.dropAcc = 0;
    if (!this.raf) {
      this.lastTs = performance.now();
      this.raf = requestAnimationFrame(this.loop);
    }
  }

  private updateLevel(): void {
    this.level = Math.max(
      this.settings.startLevel,
      Math.floor(this.linesCleared / 10) + 1,
    );
    this.dropMs = Math.max(120, 800 - (this.level - 1) * 60);
  }

  private addScore(n: number): void {
    this.score += n;
    this.hud.update(this.score, this.level, this.linesCleared);
  }

  private gameOver(): void {
    this.state = 'gameover';
    this.input.setEnabled(false);
    this.active = null;
    cancelAnimationFrame(this.raf);
    this.raf = 0;

    const { isHighScore } = recordGameEnd(
      this.score,
      this.linesCleared,
      this.level,
      this.session,
    );

    void submitGroupScore(this.score, this.linesCleared, this.level);

    const final = this.overEl.querySelector('#final-score')!;
    final.textContent = `Score: ${this.score} · ${this.linesCleared} rijen · niveau ${this.level}`;
    const banner = this.overEl.querySelector('#record-banner')!;
    banner.classList.toggle('hidden', !isHighScore);

    const correct = this.session.correctAnswers;
    const wrong = this.session.wrongAnswers;
    this.overEl.querySelector('#session-answer-stats')!.innerHTML = `
      <div class="stat-card">
        <span class="hud-label">Juist</span>
        <span class="stat-value">${correct}</span>
      </div>
      <div class="stat-card">
        <span class="hud-label">Fout</span>
        <span class="stat-value">${wrong}</span>
      </div>
    `;

    const mistakesPanel = this.overEl.querySelector('#session-mistakes')!;
    const mistakesBtn = this.overEl.querySelector(
      '#show-mistakes-btn',
    ) as HTMLButtonElement;
    mistakesPanel.classList.add('hidden');
    mistakesBtn.textContent = 'Toon fouten';
    mistakesBtn.classList.toggle('hidden', wrong === 0);

    const list = this.overEl.querySelector('#session-mistake-list')!;
    if (this.session.mistakes.length === 0) {
      list.innerHTML = '<li class="empty">Geen fouten deze sessie</li>';
    } else {
      list.innerHTML = this.session.mistakes
        .map((m) => {
          const chosenLabel =
            m.chosen === null ? 'te laat' : SOORT_LABELS[m.chosen];
          return `<li>
            <div>
              <strong>${escapeHtml(m.woord)}</strong>
              <span class="mistake-soort soort-tag soort-${m.soort}">${SOORT_LABELS[m.soort]}</span>
            </div>
            <em>jouw keuze: ${chosenLabel}</em>
          </li>`;
        })
        .join('');
    }

    this.overEl.classList.remove('hidden');
    this.startScreen.refresh();
  }

  private toggleSessionMistakes(): void {
    const panel = this.overEl.querySelector('#session-mistakes')!;
    const btn = this.overEl.querySelector(
      '#show-mistakes-btn',
    ) as HTMLButtonElement;
    const nowHidden = panel.classList.toggle('hidden');
    btn.textContent = nowHidden ? 'Toon fouten' : 'Verberg fouten';
  }

  private toast(msg: string): void {
    this.feedbackEl.textContent = msg;
    this.feedbackEl.classList.remove('hidden', 'pop');
    void this.feedbackEl.offsetWidth;
    this.feedbackEl.classList.add('pop');
    window.setTimeout(() => this.feedbackEl.classList.add('hidden'), 1400);
  }

  private draw(): void {
    this.renderer.draw(this.board, this.active);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Zelfde woord op meerdere volle rijen → één Taal-Check-vraag. */
function groupQuizLines(lines: LineInfo[]): QuizGroup[] {
  const groups: QuizGroup[] = [];
  const byKey = new Map<string, QuizGroup>();
  for (const line of lines) {
    const key = `${line.woord}\0${line.soort}`;
    let group = byKey.get(key);
    if (!group) {
      group = { woord: line.woord, soort: line.soort, rows: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    group.rows.push(line.row);
  }
  return groups;
}
