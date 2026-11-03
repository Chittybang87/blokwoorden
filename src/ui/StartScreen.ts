import {
  clearMistakes,
  getActiveMistakes,
  getMistakes,
  getRecords,
  getSettings,
  getStats,
  mistakeCountBySoort,
  PRACTICE_MIN_WORDS,
  resetStatsAndRecords,
  saveSettings,
  type Settings,
} from '../game/Storage';
import { theorieHtml } from '../data/theorie';
import {
  SOORT_LABELS,
  SOORT_LABELS_SHORT,
  WOORDSOORTEN,
  type Woordsoort,
} from '../game/types';
import {
  consumeAuthRedirect,
  getAuthUser,
  loginWithEmail,
  logout,
  registerWithEmail,
  requestPasswordReset,
  updatePassword,
  type AuthView,
} from '../online/auth';
import {
  clearJoinHash,
  createGroup,
  fetchGroupLeaderboard,
  formatInviteCode,
  getActiveGroup,
  getDisplayName,
  joinGroupByCode,
  parseJoinCodeFromLocation,
  qrDataUrlForCode,
  savePlayerName,
  setActiveGroup,
} from '../online/groups';
import { isOnlineConfigured } from '../online/supabase';

export type StartScreenAction =
  | 'newGame'
  | 'practiceGame'
  | 'settingsChanged';

type Panel =
  | 'home'
  | 'records'
  | 'stats'
  | 'mistakes'
  | 'settings'
  | 'help'
  | 'theory'
  | 'group';

export class StartScreen {
  readonly el: HTMLElement;
  private shellEl: HTMLElement;
  private panelEls: Record<Panel, HTMLElement>;
  private onAction: ((action: StartScreenAction) => void) | null = null;
  private authView: AuthView = 'login';
  private authMessage = '';

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'menu-overlay start-screen';
    this.el.innerHTML = `
      <div class="start-shell">
        <section class="start-panel" data-panel="home">
          <p class="hud-eyebrow">Woordenschat-puzzel</p>
          <h1 class="menu-title">Blokwoorden</h1>
          <p class="menu-lead">
            Stapel woordkaarten, sluit een rij en check de woordsoort.
          </p>
          <p class="start-highscore" id="home-highscore"></p>
          <div class="start-actions">
            <button type="button" class="primary-btn" data-go="newGame">Nieuw spel</button>
            <button type="button" class="secondary-btn" data-go="practiceGame" id="practice-btn">
              Oefen met fouten
            </button>
            <button type="button" class="secondary-btn" data-nav="group">Groep</button>
            <button type="button" class="secondary-btn" data-nav="mistakes">Mijn fouten</button>
            <button type="button" class="secondary-btn" data-nav="records">Records</button>
            <button type="button" class="secondary-btn" data-nav="stats">Statistieken</button>
            <button type="button" class="secondary-btn" data-nav="settings">Instellingen</button>
            <button type="button" class="secondary-btn" data-nav="theory">Theorie woordsoorten</button>
            <button type="button" class="ghost-btn" data-nav="help">Hoe werkt het?</button>
          </div>
        </section>

        <section class="start-panel hidden" data-panel="group">
          <button type="button" class="back-btn" data-nav="home">← Terug</button>
          <h2 class="panel-title">Groep</h2>
          <p class="menu-lead" id="group-status"></p>

          <div id="group-offline" class="hidden">
            <p class="menu-hint">Online groepen zijn nog niet geconfigureerd (.env).</p>
          </div>

          <div id="auth-panel">
            <p class="menu-hint" id="auth-message"></p>
            <div id="auth-login">
              <label class="setting-row group-name-row">
                <span>E-mail</span>
                <input type="email" id="auth-email" autocomplete="email" placeholder="naam@school.be" />
              </label>
              <label class="setting-row group-name-row">
                <span>Wachtwoord</span>
                <input type="password" id="auth-password" autocomplete="current-password" minlength="6" />
              </label>
              <div class="start-actions">
                <button type="button" class="primary-btn" id="auth-login-btn">Inloggen</button>
                <button type="button" class="secondary-btn" id="auth-goto-register">Account maken</button>
                <button type="button" class="ghost-btn" id="auth-goto-forgot">Wachtwoord vergeten</button>
              </div>
            </div>
            <div id="auth-register" class="hidden">
              <label class="setting-row group-name-row">
                <span>E-mail</span>
                <input type="email" id="auth-reg-email" autocomplete="email" placeholder="naam@school.be" />
              </label>
              <label class="setting-row group-name-row">
                <span>Wachtwoord</span>
                <input type="password" id="auth-reg-password" autocomplete="new-password" minlength="6" placeholder="Minstens 6 tekens" />
              </label>
              <label class="setting-row group-name-row">
                <span>Wachtwoord herhalen</span>
                <input type="password" id="auth-reg-password2" autocomplete="new-password" minlength="6" />
              </label>
              <div class="start-actions">
                <button type="button" class="primary-btn" id="auth-register-btn">Registreren</button>
                <button type="button" class="ghost-btn" id="auth-goto-login">Al een account? Inloggen</button>
              </div>
              <p class="menu-hint">Je krijgt een bevestigingsmail. Bevestig die vóór je kunt spelen in een groep.</p>
            </div>
            <div id="auth-forgot" class="hidden">
              <label class="setting-row group-name-row">
                <span>E-mail</span>
                <input type="email" id="auth-forgot-email" autocomplete="email" />
              </label>
              <div class="start-actions">
                <button type="button" class="primary-btn" id="auth-forgot-btn">Stuur resetlink</button>
                <button type="button" class="ghost-btn" id="auth-forgot-back">Terug naar inloggen</button>
              </div>
            </div>
            <div id="auth-update-password" class="hidden">
              <label class="setting-row group-name-row">
                <span>Nieuw wachtwoord</span>
                <input type="password" id="auth-new-password" autocomplete="new-password" minlength="6" />
              </label>
              <label class="setting-row group-name-row">
                <span>Herhaal nieuw wachtwoord</span>
                <input type="password" id="auth-new-password2" autocomplete="new-password" minlength="6" />
              </label>
              <div class="start-actions">
                <button type="button" class="primary-btn" id="auth-update-password-btn">Wachtwoord opslaan</button>
              </div>
            </div>
            <p class="menu-hint" id="auth-error"></p>
          </div>

          <div id="group-signed-in" class="hidden">
            <p class="menu-hint" id="auth-signed-as"></p>
            <label class="setting-row group-name-row">
              <span>Weergavenaam in de groep</span>
              <input type="text" id="player-name" maxlength="24" placeholder="Bijv. Sam" autocomplete="nickname" />
            </label>
            <button type="button" class="ghost-btn" id="auth-logout-btn">Uitloggen</button>

            <div id="group-setup">
              <label class="setting-row group-name-row">
                <span>Groepsnaam (optioneel)</span>
                <input type="text" id="group-name" maxlength="40" placeholder="Bijv. Tafel 3" />
              </label>
              <div class="start-actions">
                <button type="button" class="primary-btn" id="create-group-btn">Groep maken</button>
              </div>
              <h3 class="panel-subtitle">Of join met code</h3>
              <div class="join-row">
                <input type="text" id="join-code" maxlength="8" placeholder="K7P-2M9" autocomplete="off" spellcheck="false" />
                <button type="button" class="secondary-btn" id="join-group-btn">Join</button>
              </div>
              <p class="menu-hint" id="group-error"></p>
            </div>

            <div id="group-active" class="hidden">
              <p class="group-code-label">Uitnodigingscode</p>
              <p class="group-code" id="group-code-display"></p>
              <img class="group-qr" id="group-qr" alt="QR-code om te joinen" width="200" height="200" />
              <p class="menu-hint">Laat anderen de QR scannen of de code intoetsen.</p>
              <h3 class="panel-subtitle">Leaderboard</h3>
              <ol class="score-list" id="group-leaderboard"></ol>
              <div class="start-actions" style="margin-top:1rem">
                <button type="button" class="primary-btn" data-go="newGame">Speel in deze groep</button>
                <button type="button" class="ghost-btn" id="leave-group-btn">Andere groep</button>
              </div>
            </div>
          </div>
        </section>

        <section class="start-panel hidden" data-panel="mistakes">
          <button type="button" class="back-btn" data-nav="home">← Terug</button>
          <h2 class="panel-title">Mijn fouten</h2>
          <p class="menu-lead" id="mistakes-summary"></p>
          <div class="stat-grid" id="mistakes-by-soort"></div>
          <h3 class="panel-subtitle">Woorden om te oefenen</h3>
          <ul class="mistake-list" id="mistake-list"></ul>
          <div class="start-actions" style="margin-top:1rem">
            <button type="button" class="primary-btn" data-go="practiceGame" id="practice-from-mistakes">
              Oefen met fouten
            </button>
            <button type="button" class="danger-btn" id="clear-mistakes">Wis foutenlijst</button>
          </div>
        </section>

        <section class="start-panel hidden" data-panel="records">
          <button type="button" class="back-btn" data-nav="home">← Terug</button>
          <h2 class="panel-title">Records</h2>
          <div class="stat-grid" id="records-grid"></div>
          <h3 class="panel-subtitle">Top 5 scores</h3>
          <ol class="score-list" id="top-scores"></ol>
        </section>

        <section class="start-panel hidden" data-panel="stats">
          <button type="button" class="back-btn" data-nav="home">← Terug</button>
          <h2 class="panel-title">Statistieken</h2>
          <div class="stat-grid" id="stats-grid"></div>
          <button type="button" class="danger-btn" id="reset-stats">Wis stats &amp; records</button>
        </section>

        <section class="start-panel hidden" data-panel="settings">
          <button type="button" class="back-btn" data-nav="home">← Terug</button>
          <h2 class="panel-title">Instellingen</h2>
          <form class="settings-form" id="settings-form">
            <label class="setting-row">
              <span>Taal-Check tijd</span>
              <select name="quizTimeMs">
                <option value="20000">20 seconden</option>
                <option value="25000">25 seconden</option>
                <option value="30000">30 seconden</option>
                <option value="40000">40 seconden</option>
              </select>
            </label>
            <label class="setting-row">
              <span>Startniveau</span>
              <select name="startLevel">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>
            <label class="setting-row check">
              <span>Landingspreview tonen</span>
              <input type="checkbox" name="showGhost" />
            </label>
            <label class="setting-row check">
              <span>Touch-knoppen altijd tonen</span>
              <input type="checkbox" name="alwaysTouch" />
            </label>
          </form>
          <p class="menu-hint">Wijzigingen worden meteen opgeslagen.</p>
        </section>

        <section class="start-panel hidden" data-panel="help">
          <button type="button" class="back-btn" data-nav="home">← Terug</button>
          <h2 class="panel-title">Hoe werkt het?</h2>
          <ul class="help-list">
            <li>Vul een rij om een <strong>Taal-Check</strong> te starten.</li>
            <li>Je ziet een <strong>zin</strong> met een gemarkeerd woord — kies de juiste woordsoort.</li>
            <li><strong>Goed</strong> antwoord: de rij verdwijnt en je scoort punten.</li>
            <li><strong>Fout</strong> antwoord: de rij wordt een grijze muur en het woord komt op je foutenlijst.</li>
            <li><strong>Oefen met fouten</strong> speelt vooral met die woorden; bij te weinig fouten vullen we aan.</li>
            <li><strong>Perfect Match</strong> en <strong>Grammatica-Chain</strong> geven combo-bonussen.</li>
            <li><strong>Reeks</strong>: meerdere juiste lijnen achter elkaar geeft +10 extra per treffer en een viering.</li>
          </ul>
          <p class="menu-hint">Pijltjes / WASD · Spatie = neer · 1–9 en 0 bij Taal-Check</p>
        </section>

        <section class="start-panel hidden" data-panel="theory">
          <button type="button" class="back-btn" data-nav="home">← Terug</button>
          <h2 class="panel-title">Theorie woordsoorten</h2>
          <div class="theory-scroll">${theorieHtml()}</div>
        </section>
      </div>
    `;
    root.appendChild(this.el);

    this.shellEl = this.el.querySelector('.start-shell')!;
    this.panelEls = {
      home: this.el.querySelector('[data-panel="home"]')!,
      records: this.el.querySelector('[data-panel="records"]')!,
      stats: this.el.querySelector('[data-panel="stats"]')!,
      mistakes: this.el.querySelector('[data-panel="mistakes"]')!,
      settings: this.el.querySelector('[data-panel="settings"]')!,
      help: this.el.querySelector('[data-panel="help"]')!,
      theory: this.el.querySelector('[data-panel="theory"]')!,
      group: this.el.querySelector('[data-panel="group"]')!,
    };

    this.el.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>(
        '[data-nav], [data-go]',
      );
      if (!t) return;
      const nav = t.getAttribute('data-nav') as Panel | null;
      const go = t.getAttribute('data-go') as StartScreenAction | null;
      if (nav) void this.showPanel(nav);
      if (go === 'newGame' || go === 'practiceGame') {
        if (go === 'practiceGame' && getActiveMistakes().length === 0) {
          alert(
            'Je hebt nog geen actieve fouten. Speel eerst een gewoon spel — foute Taal-Checks komen hier terecht.',
          );
          return;
        }
        void this.persistNameFromInput();
        this.onAction?.(go);
      }
    });

    this.el.querySelector('#create-group-btn')!.addEventListener('click', () => {
      void this.onCreateGroup();
    });
    this.el.querySelector('#join-group-btn')!.addEventListener('click', () => {
      void this.onJoinGroup();
    });
    this.el.querySelector('#leave-group-btn')!.addEventListener('click', () => {
      setActiveGroup(null);
      void this.refreshGroupPanel();
    });
    this.el.querySelector('#player-name')!.addEventListener('change', () => {
      void this.persistNameFromInput();
    });

    this.el.querySelector('#auth-login-btn')!.addEventListener('click', () => {
      void this.onLogin();
    });
    this.el.querySelector('#auth-register-btn')!.addEventListener('click', () => {
      void this.onRegister();
    });
    this.el.querySelector('#auth-forgot-btn')!.addEventListener('click', () => {
      void this.onForgotPassword();
    });
    this.el
      .querySelector('#auth-update-password-btn')!
      .addEventListener('click', () => {
        void this.onUpdatePassword();
      });
    this.el.querySelector('#auth-logout-btn')!.addEventListener('click', () => {
      void this.onLogout();
    });
    this.el.querySelector('#auth-goto-register')!.addEventListener('click', () => {
      this.authView = 'register';
      this.authMessage = '';
      this.renderAuthView();
    });
    this.el.querySelector('#auth-goto-login')!.addEventListener('click', () => {
      this.authView = 'login';
      this.authMessage = '';
      this.renderAuthView();
    });
    this.el.querySelector('#auth-goto-forgot')!.addEventListener('click', () => {
      this.authView = 'forgot';
      this.authMessage = '';
      this.renderAuthView();
    });
    this.el.querySelector('#auth-forgot-back')!.addEventListener('click', () => {
      this.authView = 'login';
      this.authMessage = '';
      this.renderAuthView();
    });

    this.el.querySelector('#reset-stats')!.addEventListener('click', () => {
      if (
        !confirm(
          'Weet je zeker dat je alle statistieken en records wilt wissen?',
        )
      ) {
        return;
      }
      resetStatsAndRecords();
      this.refresh();
    });

    this.el.querySelector('#clear-mistakes')!.addEventListener('click', () => {
      if (!confirm('Foutenlijst wissen?')) return;
      clearMistakes();
      this.refresh();
    });

    const form = this.el.querySelector('#settings-form') as HTMLFormElement;
    form.addEventListener('change', () => {
      this.persistSettings(form);
      this.onAction?.('settingsChanged');
    });

    this.refresh();
  }

  setHandler(handler: (action: StartScreenAction) => void): void {
    this.onAction = handler;
  }

  show(): void {
    this.refresh();
    void this.showPanel('home');
    this.el.classList.remove('hidden');
    void this.bootstrapAuthAndJoin();
  }

  hide(): void {
    this.el.classList.add('hidden');
  }

  refresh(): void {
    const records = getRecords();
    const stats = getStats();
    const settings = getSettings();
    const active = getActiveMistakes();
    const allMistakes = getMistakes();
    const group = getActiveGroup();

    const nameInput = this.el.querySelector('#player-name') as HTMLInputElement;
    if (document.activeElement !== nameInput) {
      nameInput.value = getDisplayName();
    }

    const hs = this.el.querySelector('#home-highscore')!;
    const parts: string[] = [];
    if (records.highScore > 0) parts.push(`Record: ${records.highScore}`);
    if (group) parts.push(`Groep: ${group.name}`);
    parts.push(
      active.length > 0
        ? `${active.length} woord${active.length === 1 ? '' : 'en'} om te oefenen`
        : 'Nog geen fouten om te oefenen',
    );
    hs.textContent = parts.join(' · ');

    const practiceDisabled = active.length === 0;
    for (const id of ['practice-btn', 'practice-from-mistakes']) {
      const btn = this.el.querySelector(`#${id}`) as HTMLButtonElement;
      btn.disabled = practiceDisabled;
      btn.title = practiceDisabled
        ? 'Nog geen fouten — speel eerst een gewoon spel'
        : active.length < PRACTICE_MIN_WORDS
          ? `Start met ${active.length} fouten + aanvulling tot ${PRACTICE_MIN_WORDS} woorden`
          : `Oefen met ${active.length} fouten`;
    }

    const summary = this.el.querySelector('#mistakes-summary')!;
    if (active.length === 0) {
      summary.textContent =
        allMistakes.length > 0
          ? 'Alle eerdere fouten zijn weer goed beantwoord. Goed bezig!'
          : 'Nog geen fouten. Foute Taal-Checks verschijnen hier per woord.';
    } else {
      const padNote =
        active.length < PRACTICE_MIN_WORDS
          ? ` Bij oefenen vullen we aan tot minstens ${PRACTICE_MIN_WORDS} woorden.`
          : '';
      summary.textContent = `${active.length} actieve fout${active.length === 1 ? '' : 'en'} om te herhalen.${padNote}`;
    }

    const bySoort = mistakeCountBySoort();
    this.el.querySelector('#mistakes-by-soort')!.innerHTML = WOORDSOORTEN.map(
      (s) => this.statCard(SOORT_LABELS_SHORT[s], String(bySoort[s])),
    ).join('');

    const list = this.el.querySelector('#mistake-list')!;
    if (active.length === 0) {
      list.innerHTML = '<li class="empty">Geen actieve fouten</li>';
    } else {
      list.innerHTML = active
        .map((m) => {
          const progress =
            m.recoveredCount > 0
              ? ` · ${m.recoveredCount}× weer goed`
              : '';
          const topWrong = topWrongChoice(m.byChoice);
          const hint = topWrong
            ? ` · vaak als “${topWrong}”`
            : '';
          return `<li>
            <div>
              <strong>${m.woord}</strong>
              <span class="mistake-soort soort-tag soort-${m.soort}">${SOORT_LABELS[m.soort]}</span>
            </div>
            <em>${m.wrongCount}× fout${progress}${hint}</em>
          </li>`;
        })
        .join('');
    }

    this.el.querySelector('#records-grid')!.innerHTML = [
      this.statCard('Hoogste score', String(records.highScore)),
      this.statCard('Meeste rijen', String(records.mostLines)),
      this.statCard('Hoogste niveau', String(records.highestLevel)),
      this.statCard('Beste combo', `×${records.bestMultiplier}`),
      this.statCard(
        'Beste Perfect Match-spel',
        String(records.bestPerfectInGame),
      ),
    ].join('');

    const topList = this.el.querySelector('#top-scores')!;
    if (records.topScores.length === 0) {
      topList.innerHTML = '<li class="empty">Nog geen scores</li>';
    } else {
      topList.innerHTML = records.topScores
        .map((s) => {
          const d = new Date(s.date);
          const label = d.toLocaleDateString('nl-BE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
          return `<li><strong>${s.score}</strong> <span>${s.lines} rijen · nv. ${s.level}</span> <em>${label}</em></li>`;
        })
        .join('');
    }

    this.el.querySelector('#stats-grid')!.innerHTML = [
      this.statCard('Spellen', String(stats.gamesPlayed)),
      this.statCard('Totale score', String(stats.totalScore)),
      this.statCard('Rijen geruimd', String(stats.totalLines)),
      this.statCard('Goede antwoorden', String(stats.correctAnswers)),
      this.statCard('Foute antwoorden', String(stats.wrongAnswers)),
      this.statCard('Perfect Matches', String(stats.perfectMatches)),
      this.statCard('Grammatica-Chains', String(stats.grammarChains)),
      this.statCard('Grijze muren', String(stats.wallsCreated)),
    ].join('');

    this.fillSettings(settings);
  }

  private fillSettings(settings: Settings): void {
    const form = this.el.querySelector('#settings-form') as HTMLFormElement;
    (form.elements.namedItem('quizTimeMs') as HTMLSelectElement).value = String(
      settings.quizTimeMs,
    );
    (form.elements.namedItem('startLevel') as HTMLSelectElement).value = String(
      settings.startLevel,
    );
    (form.elements.namedItem('showGhost') as HTMLInputElement).checked =
      settings.showGhost;
    (form.elements.namedItem('alwaysTouch') as HTMLInputElement).checked =
      settings.alwaysTouch;
  }

  private persistSettings(form: HTMLFormElement): void {
    saveSettings({
      quizTimeMs: Number(
        (form.elements.namedItem('quizTimeMs') as HTMLSelectElement).value,
      ),
      startLevel: Number(
        (form.elements.namedItem('startLevel') as HTMLSelectElement).value,
      ),
      showGhost: (form.elements.namedItem('showGhost') as HTMLInputElement)
        .checked,
      alwaysTouch: (form.elements.namedItem('alwaysTouch') as HTMLInputElement)
        .checked,
    });
  }

  private async showPanel(panel: Panel): Promise<void> {
    if (
      panel === 'records' ||
      panel === 'stats' ||
      panel === 'mistakes' ||
      panel === 'group'
    ) {
      this.refresh();
    }
    this.shellEl.classList.toggle('theory-open', panel === 'theory');
    this.shellEl.scrollTop = 0;
    (Object.keys(this.panelEls) as Panel[]).forEach((key) => {
      this.panelEls[key].classList.toggle('hidden', key !== panel);
    });
    if (panel === 'group') {
      await this.refreshGroupPanel();
    }
  }

  private setGroupError(msg: string): void {
    const el = this.el.querySelector('#group-error');
    if (el) el.textContent = msg;
  }

  private setAuthError(msg: string): void {
    this.el.querySelector('#auth-error')!.textContent = msg;
  }

  private renderAuthView(): void {
    const login = this.el.querySelector('#auth-login')!;
    const register = this.el.querySelector('#auth-register')!;
    const forgot = this.el.querySelector('#auth-forgot')!;
    const updatePw = this.el.querySelector('#auth-update-password')!;
    login.classList.toggle('hidden', this.authView !== 'login');
    register.classList.toggle('hidden', this.authView !== 'register');
    forgot.classList.toggle('hidden', this.authView !== 'forgot');
    updatePw.classList.toggle('hidden', this.authView !== 'updatePassword');
    this.el.querySelector('#auth-message')!.textContent = this.authMessage;
    this.setAuthError('');
  }

  private async bootstrapAuthAndJoin(): Promise<void> {
    if (!isOnlineConfigured) return;
    try {
      const redirectView = await consumeAuthRedirect();
      if (redirectView === 'updatePassword') {
        this.authView = 'updatePassword';
        this.authMessage = 'Kies een nieuw wachtwoord.';
        await this.showPanel('group');
        return;
      }
    } catch (e) {
      console.warn(e);
    }
    await this.handlePendingJoin();
  }

  private async persistNameFromInput(): Promise<void> {
    const input = this.el.querySelector('#player-name') as HTMLInputElement | null;
    if (!input) return;
    const name = input.value.trim();
    if (!name) return;
    try {
      await savePlayerName(name);
    } catch (e) {
      console.warn(e);
    }
  }

  private async onLogin(): Promise<void> {
    const email = (this.el.querySelector('#auth-email') as HTMLInputElement).value;
    const password = (this.el.querySelector('#auth-password') as HTMLInputElement)
      .value;
    this.setAuthError('');
    try {
      await loginWithEmail(email, password);
      this.authMessage = '';
      await this.refreshGroupPanel();
    } catch (e) {
      this.setAuthError(e instanceof Error ? e.message : 'Inloggen mislukt.');
    }
  }

  private async onRegister(): Promise<void> {
    const email = (this.el.querySelector('#auth-reg-email') as HTMLInputElement)
      .value;
    const password = (
      this.el.querySelector('#auth-reg-password') as HTMLInputElement
    ).value;
    const password2 = (
      this.el.querySelector('#auth-reg-password2') as HTMLInputElement
    ).value;
    this.setAuthError('');
    if (password !== password2) {
      this.setAuthError('Wachtwoorden komen niet overeen.');
      return;
    }
    try {
      const { needsEmailConfirm } = await registerWithEmail(email, password);
      if (needsEmailConfirm) {
        this.authView = 'login';
        this.authMessage =
          'Account aangemaakt. Check je inbox en bevestig je e-mail vóór je inlogt.';
        this.renderAuthView();
      } else {
        await this.refreshGroupPanel();
      }
    } catch (e) {
      this.setAuthError(e instanceof Error ? e.message : 'Registreren mislukt.');
    }
  }

  private async onForgotPassword(): Promise<void> {
    const email = (
      this.el.querySelector('#auth-forgot-email') as HTMLInputElement
    ).value;
    this.setAuthError('');
    try {
      await requestPasswordReset(email);
      this.authView = 'login';
      this.authMessage =
        'Als dit e-mailadres bestaat, sturen we een link om je wachtwoord te resetten.';
      this.renderAuthView();
    } catch (e) {
      this.setAuthError(
        e instanceof Error ? e.message : 'Resetmail versturen mislukt.',
      );
    }
  }

  private async onUpdatePassword(): Promise<void> {
    const p1 = (this.el.querySelector('#auth-new-password') as HTMLInputElement)
      .value;
    const p2 = (this.el.querySelector('#auth-new-password2') as HTMLInputElement)
      .value;
    this.setAuthError('');
    if (p1 !== p2) {
      this.setAuthError('Wachtwoorden komen niet overeen.');
      return;
    }
    try {
      await updatePassword(p1);
      this.authView = 'login';
      this.authMessage = 'Wachtwoord bijgewerkt. Je bent ingelogd.';
      await this.refreshGroupPanel();
    } catch (e) {
      this.setAuthError(
        e instanceof Error ? e.message : 'Wachtwoord wijzigen mislukt.',
      );
    }
  }

  private async onLogout(): Promise<void> {
    setActiveGroup(null);
    await logout();
    this.authView = 'login';
    this.authMessage = 'Je bent uitgelogd.';
    await this.refreshGroupPanel();
  }

  private async onCreateGroup(): Promise<void> {
    this.setGroupError('');
    const nameInput = this.el.querySelector('#player-name') as HTMLInputElement;
    const groupInput = this.el.querySelector('#group-name') as HTMLInputElement;
    if (!nameInput.value.trim()) {
      this.setGroupError('Vul eerst je weergavenaam in.');
      return;
    }
    try {
      await savePlayerName(nameInput.value);
      await createGroup(groupInput.value);
      await this.refreshGroupPanel();
    } catch (e) {
      this.setGroupError(e instanceof Error ? e.message : 'Groep maken mislukt.');
    }
  }

  private async onJoinGroup(rawCode?: string): Promise<void> {
    this.setGroupError('');
    const nameInput = this.el.querySelector('#player-name') as HTMLInputElement;
    const codeInput = this.el.querySelector('#join-code') as HTMLInputElement;
    const code = (rawCode ?? codeInput.value).trim();
    if (!nameInput.value.trim()) {
      this.setGroupError('Vul eerst je weergavenaam in.');
      return;
    }
    if (!code) {
      this.setGroupError('Vul de groepscode in.');
      return;
    }
    try {
      await savePlayerName(nameInput.value);
      await joinGroupByCode(code);
      codeInput.value = '';
      clearJoinHash();
      await this.refreshGroupPanel();
    } catch (e) {
      this.setGroupError(e instanceof Error ? e.message : 'Joinen mislukt.');
    }
  }

  private async handlePendingJoin(): Promise<void> {
    const code = parseJoinCodeFromLocation();
    if (!code) return;
    await this.showPanel('group');
    const user = await getAuthUser();
    if (!user?.emailConfirmed) {
      this.authMessage = 'Log in (met bevestigde e-mail) om de groep te joinen.';
      this.renderAuthView();
      return;
    }
    const codeInput = this.el.querySelector('#join-code') as HTMLInputElement;
    codeInput.value = formatInviteCode(code);
    if (getDisplayName()) {
      await this.onJoinGroup(code);
    } else {
      this.setGroupError('Vul je weergavenaam in en druk op Join.');
    }
  }

  private async refreshGroupPanel(): Promise<void> {
    const offline = this.el.querySelector('#group-offline')!;
    const authPanel = this.el.querySelector('#auth-panel')!;
    const signedIn = this.el.querySelector('#group-signed-in')!;
    const setup = this.el.querySelector('#group-setup')!;
    const activeEl = this.el.querySelector('#group-active')!;
    const status = this.el.querySelector('#group-status')!;
    const configured = isOnlineConfigured;

    offline.classList.toggle('hidden', configured);
    if (!configured) {
      authPanel.classList.add('hidden');
      signedIn.classList.add('hidden');
      status.textContent = 'Online groepen niet beschikbaar.';
      return;
    }

    if (this.authView === 'updatePassword') {
      authPanel.classList.remove('hidden');
      signedIn.classList.add('hidden');
      status.textContent = 'Nieuw wachtwoord instellen';
      this.renderAuthView();
      return;
    }

    const user = await getAuthUser();
    const loggedIn = Boolean(user?.emailConfirmed);

    authPanel.classList.toggle('hidden', loggedIn);
    signedIn.classList.toggle('hidden', !loggedIn);

    if (!loggedIn) {
      status.textContent =
        'Maak een account met e-mail (bevestigen verplicht) om groepen te gebruiken.';
      if (user && !user.emailConfirmed) {
        this.authMessage =
          'Je e-mail is nog niet bevestigd. Check je inbox en klik op de link.';
      }
      this.renderAuthView();
      return;
    }

    this.el.querySelector('#auth-signed-as')!.textContent =
      `Ingelogd als ${user!.email}`;

    const nameInput = this.el.querySelector('#player-name') as HTMLInputElement;
    if (document.activeElement !== nameInput) {
      nameInput.value = getDisplayName();
    }

    const group = getActiveGroup();
    setup.classList.toggle('hidden', Boolean(group));
    activeEl.classList.toggle('hidden', !group);

    if (!group) {
      status.textContent =
        'Maak een groep of join met een korte code. Scores verschijnen op het groepsleaderboard.';
      return;
    }

    status.textContent = `Actieve groep: ${group.name}`;
    this.el.querySelector('#group-code-display')!.textContent =
      formatInviteCode(group.code);

    const qr = this.el.querySelector('#group-qr') as HTMLImageElement;
    try {
      qr.src = await qrDataUrlForCode(group.code);
      qr.classList.remove('hidden');
    } catch {
      qr.classList.add('hidden');
    }

    const list = this.el.querySelector('#group-leaderboard')!;
    list.innerHTML = '<li class="empty">Laden…</li>';
    try {
      const rows = await fetchGroupLeaderboard(group.id);
      if (rows.length === 0) {
        list.innerHTML = '<li class="empty">Nog geen scores in deze groep</li>';
      } else {
        list.innerHTML = rows
          .map(
            (r, i) =>
              `<li><strong>${i + 1}. ${r.score}</strong> <span>${escapeHtml(r.displayName)} · nv. ${r.level}</span> <em>${r.lines} rijen</em></li>`,
          )
          .join('');
      }
    } catch (e) {
      list.innerHTML = `<li class="empty">${escapeHtml(e instanceof Error ? e.message : 'Kon leaderboard niet laden')}</li>`;
    }
  }

  private statCard(label: string, value: string): string {
    return `<div class="stat-card"><span class="hud-label">${label}</span><span class="stat-value">${value}</span></div>`;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function topWrongChoice(
  byChoice: Partial<Record<Woordsoort | 'timeout', number>>,
): string | null {
  let best: string | null = null;
  let n = 0;
  for (const [k, v] of Object.entries(byChoice)) {
    if ((v ?? 0) > n) {
      n = v ?? 0;
      best = k === 'timeout' ? 'te laat' : SOORT_LABELS[k as Woordsoort];
    }
  }
  return best;
}
