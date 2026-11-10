import {
  SOORT_LABELS,
  WOORDSOORTEN,
  type TheorySection,
  type Woordsoort,
  type WordRow,
} from '@blokwoorden/shared';
import {
  createTheorySection,
  createWord,
  deleteTheorySection,
  deleteWord,
  fetchAdminGroupMembers,
  fetchAdminGroups,
  fetchAdminGroupScores,
  fetchAdminPlayers,
  fetchTheorySections,
  fetchWords,
  updateTheorySection,
  updateWord,
  type AdminGroup,
  type AdminGroupMember,
  type AdminPlayer,
  type AdminScore,
} from './api';
import {
  checkIsAdmin,
  clearPasswordRecoveryPending,
  consumeAuthRedirect,
  getAuthUser,
  isPasswordRecoveryPending,
  loginWithEmail,
  logout,
  markPasswordRecoveryPending,
  requestPasswordReset,
  updatePassword,
  type AuthUserInfo,
  type AuthView,
} from './auth';
import { isOnlineConfigured } from './supabase';

type Panel = 'words' | 'theory' | 'users' | 'groups';

export class AdminApp {
  private root: HTMLElement;
  private user: AuthUserInfo | null = null;
  private authView: AuthView = 'login';
  private panel: Panel = 'words';
  private status = '';
  private statusError = false;

  private words: WordRow[] = [];
  private wordQuery = '';
  private wordSoortFilter: '' | Woordsoort = '';
  private editingWordId: string | null = null;

  private theory: TheorySection[] = [];
  private editingTheoryId: string | null = null;

  private players: AdminPlayer[] = [];
  private groups: AdminGroup[] = [];
  private selectedGroupId: string | null = null;
  private groupMembers: AdminGroupMember[] = [];
  private groupScores: AdminScore[] = [];

  constructor(root: HTMLElement) {
    this.root = root;
    void this.boot();
  }

  private async boot(): Promise<void> {
    this.renderLoading('Beheer laden…');
    try {
      if (!isOnlineConfigured) {
        this.renderConfigMissing();
        return;
      }

      const redirect = await consumeAuthRedirect();
      if (redirect.error) {
        this.authView = 'login';
        this.setStatus(redirect.error, true);
        this.renderLogin();
        return;
      }
      if (
        redirect.view === 'updatePassword' ||
        (isPasswordRecoveryPending() && (await getAuthUser()))
      ) {
        this.authView = 'updatePassword';
        this.renderLogin();
        return;
      }

      this.user = await getAuthUser();
      if (!this.user) {
        this.renderLogin();
        return;
      }
      if (!this.user.emailConfirmed) {
        this.renderMessage(
          'Bevestig eerst je e-mail via de link in je inbox, en log daarna opnieuw in.',
        );
        return;
      }

      // Ingelogd via resetlink maar flag gemist → toch wachtwoord kunnen zetten.
      if (isPasswordRecoveryPending()) {
        this.authView = 'updatePassword';
        this.renderLogin();
        return;
      }

      const admin = await checkIsAdmin();
      if (!admin) {
        this.renderNotAdmin(this.user.email);
        return;
      }
      await this.loadPanelData();
      this.render();
    } catch (err) {
      this.authView = 'login';
      this.setStatus(err instanceof Error ? err.message : 'Starten mislukt', true);
      this.renderLogin();
    }
  }

  private renderNotAdmin(email: string): void {
    this.root.innerHTML = `
      <div class="admin-shell">
        <div class="panel login-card">
          <h2>Geen beheerrechten</h2>
          <p class="lead">Je bent ingelogd als <strong>${escapeHtml(email)}</strong>, maar <code>is_admin</code> staat nog uit.</p>
          <p class="lead">Voer dit uit in Supabase → SQL Editor:</p>
          <pre style="white-space:pre-wrap;background:#eef4f1;padding:0.75rem;border-radius:8px;font-size:0.85rem">update public.players
set is_admin = true
where id = (
  select id from auth.users
  where email = 'tim.goossens@live.com'
);</pre>
          <p class="lead">Of stel eerst een nieuw wachtwoord in (handig na een resetlink):</p>
          <button type="button" class="btn primary" data-action="set-password">Nieuw wachtwoord instellen</button>
          <button type="button" class="btn secondary" data-action="logout">Uitloggen</button>
        </div>
      </div>`;
    this.root.querySelector('[data-action="set-password"]')?.addEventListener('click', () => {
      markPasswordRecoveryPending();
      this.authView = 'updatePassword';
      this.renderLogin();
    });
    this.root.querySelector('[data-action="logout"]')?.addEventListener('click', () => {
      void this.onLogout();
    });
  }

  private setStatus(msg: string, error = false): void {
    this.status = msg;
    this.statusError = error;
  }

  private renderLoading(msg: string): void {
    this.root.innerHTML = `<div class="admin-shell"><div class="panel"><p class="lead">${escapeHtml(msg)}</p></div></div>`;
  }

  private renderConfigMissing(): void {
    this.root.innerHTML = `
      <div class="admin-shell">
        <div class="panel login-card">
          <h2>Supabase niet geconfigureerd</h2>
          <p class="lead">Zet <code>VITE_SUPABASE_URL</code> en <code>VITE_SUPABASE_ANON_KEY</code> in <code>apps/admin/.env</code>.</p>
        </div>
      </div>`;
  }

  private renderMessage(msg: string, withLogout = false): void {
    this.root.innerHTML = `
      <div class="admin-shell">
        <div class="panel login-card">
          <h2>Blokwoorden Beheer</h2>
          <p class="lead">${escapeHtml(msg)}</p>
          ${withLogout ? `<button type="button" class="btn secondary" data-action="logout">Uitloggen</button>` : ''}
        </div>
      </div>`;
    this.root.querySelector('[data-action="logout"]')?.addEventListener('click', () => {
      void this.onLogout();
    });
  }

  private renderLogin(): void {
    if (this.authView === 'forgot') {
      this.root.innerHTML = `
        <div class="admin-shell">
          <div class="panel login-card">
            <h2>Wachtwoord vergeten</h2>
            <p class="lead">We sturen een resetlink naar je e-mail. Zorg dat <code>http://localhost:5174</code> in Supabase Redirect URLs staat.</p>
            <form class="login-form" data-form="forgot">
              <label>E-mail <input name="email" type="email" required autocomplete="email" value="tim.goossens@live.com" /></label>
              <button class="btn primary" type="submit">Stuur resetlink</button>
              <button class="btn secondary" type="button" data-goto="login">Terug naar inloggen</button>
              <p class="status" data-status></p>
            </form>
          </div>
        </div>`;
      this.bindAuthNav();
      const form = this.root.querySelector<HTMLFormElement>('[data-form="forgot"]')!;
      const statusEl = this.root.querySelector<HTMLElement>('[data-status]')!;
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const email = String(new FormData(form).get('email') || '');
        void (async () => {
          try {
            statusEl.classList.remove('error');
            statusEl.textContent = 'Bezig…';
            await requestPasswordReset(email);
            statusEl.textContent =
              'Als dit adres bestaat, ontvang je een e-mail met een resetlink.';
          } catch (err) {
            statusEl.textContent = err instanceof Error ? err.message : 'Mislukt';
            statusEl.classList.add('error');
          }
        })();
      });
      return;
    }

    if (this.authView === 'updatePassword') {
      this.root.innerHTML = `
        <div class="admin-shell">
          <div class="panel login-card">
            <h2>Nieuw wachtwoord</h2>
            <p class="lead">Kies een nieuw wachtwoord voor je account.</p>
            <form class="login-form" data-form="update-password">
              <label>Nieuw wachtwoord <input name="password" type="password" required minlength="6" autocomplete="new-password" /></label>
              <button class="btn primary" type="submit">Opslaan</button>
              <p class="status" data-status></p>
            </form>
          </div>
        </div>`;
      const form = this.root.querySelector<HTMLFormElement>('[data-form="update-password"]')!;
      const statusEl = this.root.querySelector<HTMLElement>('[data-status]')!;
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const password = String(new FormData(form).get('password') || '');
        void (async () => {
          try {
            statusEl.classList.remove('error');
            statusEl.textContent = 'Bezig…';
            await updatePassword(password);
            clearPasswordRecoveryPending();
            await logout();
            this.user = null;
            this.authView = 'login';
            this.setStatus('Wachtwoord gewijzigd. Log nu in met je nieuwe wachtwoord.');
            this.statusError = false;
            this.renderLogin();
          } catch (err) {
            statusEl.textContent = err instanceof Error ? err.message : 'Mislukt';
            statusEl.classList.add('error');
          }
        })();
      });
      return;
    }

    this.root.innerHTML = `
      <div class="admin-shell">
        <div class="panel login-card">
          <h2>Blokwoorden Beheer</h2>
          <p class="lead">Log in met een account dat <strong>is_admin</strong> heeft.</p>
          <form class="login-form" data-form="login">
            <label>E-mail <input name="email" type="email" required autocomplete="username" value="tim.goossens@live.com" /></label>
            <label>Wachtwoord <input name="password" type="password" required autocomplete="current-password" /></label>
            <button class="btn primary" type="submit">Inloggen</button>
            <button class="btn secondary" type="button" data-goto="forgot">Wachtwoord vergeten</button>
            <button class="btn secondary" type="button" data-action="set-password-session">Nieuw wachtwoord (na resetlink)</button>
            <p class="lead muted" style="margin:0.5rem 0 0;font-size:0.85rem">
              Bij e-mail rate limit: Supabase → Authentication → Users → jouw user → zet daar een wachtwoord.
            </p>
            <p class="status ${this.statusError ? 'error' : ''}" data-status>${escapeHtml(this.status)}</p>
          </form>
        </div>
      </div>`;
    this.bindAuthNav();
    this.root
      .querySelector('[data-action="set-password-session"]')
      ?.addEventListener('click', () => {
        void (async () => {
          const user = await getAuthUser();
          if (!user) {
            this.setStatus(
              'Geen actieve resetsessie. Open eerst de resetlink uit je mail (in deze browser), of zet het wachtwoord in het Supabase Dashboard.',
              true,
            );
            this.renderLogin();
            return;
          }
          markPasswordRecoveryPending();
          this.authView = 'updatePassword';
          this.renderLogin();
        })();
      });
    const form = this.root.querySelector<HTMLFormElement>('[data-form="login"]')!;
    const statusEl = this.root.querySelector<HTMLElement>('[data-status]')!;
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      void (async () => {
        try {
          statusEl.textContent = 'Bezig…';
          statusEl.classList.remove('error');
          await loginWithEmail(String(fd.get('email')), String(fd.get('password')));
          this.user = await getAuthUser();
          const admin = await checkIsAdmin();
          if (!admin) {
            statusEl.textContent =
              'Inloggen lukte, maar dit account heeft geen is_admin. Voer in Supabase uit: update public.players set is_admin = true where id = (select id from auth.users where email = \'tim.goossens@live.com\');';
            statusEl.classList.add('error');
            return;
          }
          this.status = '';
          await this.loadPanelData();
          this.render();
        } catch (err) {
          statusEl.textContent = err instanceof Error ? err.message : 'Login mislukt';
          statusEl.classList.add('error');
        }
      })();
    });
  }

  private bindAuthNav(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-goto]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.authView = btn.dataset.goto as AuthView;
        this.status = '';
        this.statusError = false;
        this.renderLogin();
      });
    });
  }

  private async onLogout(): Promise<void> {
    await logout();
    this.user = null;
    this.renderLogin();
  }

  private async loadPanelData(): Promise<void> {
    if (this.panel === 'words') {
      this.words = await fetchWords(true);
    } else if (this.panel === 'theory') {
      this.theory = await fetchTheorySections();
    } else if (this.panel === 'users') {
      this.players = await fetchAdminPlayers();
    } else {
      this.groups = await fetchAdminGroups();
      if (this.selectedGroupId) {
        await this.loadGroupDetail(this.selectedGroupId);
      }
    }
  }

  private async loadGroupDetail(groupId: string): Promise<void> {
    this.selectedGroupId = groupId;
    const [members, scores] = await Promise.all([
      fetchAdminGroupMembers(groupId),
      fetchAdminGroupScores(groupId),
    ]);
    this.groupMembers = members;
    this.groupScores = scores;
  }

  private async switchPanel(panel: Panel): Promise<void> {
    this.panel = panel;
    this.editingWordId = null;
    this.editingTheoryId = null;
    this.setStatus('');
    this.renderLoading('Laden…');
    try {
      await this.loadPanelData();
      this.render();
    } catch (err) {
      this.setStatus(err instanceof Error ? err.message : 'Laden mislukt', true);
      this.render();
    }
  }

  private render(): void {
    this.root.innerHTML = `
      <div class="admin-shell">
        <header class="admin-header">
          <div>
            <h1 class="admin-brand">Blokwoorden Beheer</h1>
            <p class="admin-sub">Woorden, theorie en gebruikers</p>
          </div>
          <div class="admin-user">
            ${escapeHtml(this.user?.email ?? '')}
            <button type="button" class="btn secondary" data-action="logout" style="margin-left:0.6rem">Uitloggen</button>
          </div>
        </header>
        <nav class="admin-nav">
          <button type="button" data-panel="words" class="${this.panel === 'words' ? 'active' : ''}">Woorden</button>
          <button type="button" data-panel="theory" class="${this.panel === 'theory' ? 'active' : ''}">Theorie</button>
          <button type="button" data-panel="users" class="${this.panel === 'users' ? 'active' : ''}">Gebruikers</button>
          <button type="button" data-panel="groups" class="${this.panel === 'groups' ? 'active' : ''}">Groepen</button>
        </nav>
        <section class="panel" data-main></section>
      </div>`;

    this.root.querySelector('[data-action="logout"]')?.addEventListener('click', () => {
      void this.onLogout();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-panel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        void this.switchPanel(btn.dataset.panel as Panel);
      });
    });

    const main = this.root.querySelector<HTMLElement>('[data-main]')!;
    if (this.panel === 'words') this.renderWords(main);
    else if (this.panel === 'theory') this.renderTheory(main);
    else if (this.panel === 'users') this.renderUsers(main);
    else this.renderGroups(main);
  }

  private filteredWords(): WordRow[] {
    const q = this.wordQuery.trim().toLowerCase();
    return this.words.filter((w) => {
      if (this.wordSoortFilter && w.soort !== this.wordSoortFilter) return false;
      if (!q) return true;
      return (
        w.woord.toLowerCase().includes(q) ||
        (w.zin ?? '').toLowerCase().includes(q)
      );
    });
  }

  private renderWords(main: HTMLElement): void {
    const editing = this.editingWordId
      ? this.words.find((w) => w.id === this.editingWordId) ?? null
      : null;
    const rows = this.filteredWords();

    main.innerHTML = `
      <h2>Woorden</h2>
      <p class="lead">${this.words.length} items in de bank · ${rows.length} getoond</p>
      <div class="toolbar">
        <input type="search" placeholder="Zoek woord of zin…" value="${escapeAttr(this.wordQuery)}" data-word-q />
        <select data-word-soort>
          <option value="">Alle woordsoorten</option>
          ${WOORDSOORTEN.map(
            (s) =>
              `<option value="${s}" ${this.wordSoortFilter === s ? 'selected' : ''}>${escapeHtml(SOORT_LABELS[s])}</option>`,
          ).join('')}
        </select>
        <button type="button" class="btn primary" data-action="new-word">Nieuw woord</button>
      </div>
      <form class="form-grid" data-word-form>
        <input type="hidden" name="id" value="${escapeAttr(editing?.id ?? '')}" />
        <label>Woord <input name="woord" required value="${escapeAttr(editing?.woord ?? '')}" /></label>
        <label>Woordsoort
          <select name="soort" required>
            ${WOORDSOORTEN.map(
              (s) =>
                `<option value="${s}" ${(editing?.soort ?? 'zelfstandig') === s ? 'selected' : ''}>${escapeHtml(SOORT_LABELS[s])}</option>`,
            ).join('')}
          </select>
        </label>
        <label class="full">Voorbeeldzin <input name="zin" value="${escapeAttr(editing?.zin ?? '')}" /></label>
        <label>Actief
          <select name="active">
            <option value="true" ${editing?.active !== false ? 'selected' : ''}>Ja</option>
            <option value="false" ${editing?.active === false ? 'selected' : ''}>Nee</option>
          </select>
        </label>
        <div class="form-actions full">
          <button class="btn primary" type="submit">${editing ? 'Opslaan' : 'Toevoegen'}</button>
          ${editing ? `<button class="btn secondary" type="button" data-action="cancel-word">Annuleren</button>` : ''}
        </div>
      </form>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Woord</th><th>Soort</th><th>Zin</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            ${
              rows.length === 0
                ? `<tr><td colspan="5" class="empty-state">Geen woorden gevonden.</td></tr>`
                : rows
                    .map(
                      (w) => `
              <tr>
                <td><strong>${escapeHtml(w.woord)}</strong></td>
                <td>${escapeHtml(SOORT_LABELS[w.soort])}</td>
                <td class="muted">${escapeHtml(w.zin ?? '—')}</td>
                <td>${w.active ? '<span class="badge">Actief</span>' : '<span class="badge off">Uit</span>'}</td>
                <td class="row-actions">
                  <button type="button" data-edit-word="${w.id}">Bewerk</button>
                  <button type="button" data-del-word="${w.id}">Verwijder</button>
                </td>
              </tr>`,
                    )
                    .join('')
            }
          </tbody>
        </table>
      </div>
      <p class="status ${this.statusError ? 'error' : ''}">${escapeHtml(this.status)}</p>`;

    main.querySelector<HTMLInputElement>('[data-word-q]')!.addEventListener('input', (ev) => {
      this.wordQuery = (ev.target as HTMLInputElement).value;
      this.render();
    });
    main.querySelector<HTMLSelectElement>('[data-word-soort]')!.addEventListener('change', (ev) => {
      this.wordSoortFilter = (ev.target as HTMLSelectElement).value as '' | Woordsoort;
      this.render();
    });
    main.querySelector('[data-action="new-word"]')?.addEventListener('click', () => {
      this.editingWordId = null;
      this.render();
    });
    main.querySelector('[data-action="cancel-word"]')?.addEventListener('click', () => {
      this.editingWordId = null;
      this.render();
    });
    main.querySelectorAll<HTMLButtonElement>('[data-edit-word]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.editingWordId = btn.dataset.editWord ?? null;
        this.render();
      });
    });
    main.querySelectorAll<HTMLButtonElement>('[data-del-word]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.delWord!;
        if (!confirm('Woord definitief verwijderen?')) return;
        void (async () => {
          try {
            await deleteWord(id);
            this.setStatus('Woord verwijderd.');
            this.words = await fetchWords(true);
            if (this.editingWordId === id) this.editingWordId = null;
            this.render();
          } catch (err) {
            this.setStatus(err instanceof Error ? err.message : 'Verwijderen mislukt', true);
            this.render();
          }
        })();
      });
    });

    main.querySelector<HTMLFormElement>('[data-word-form]')!.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target as HTMLFormElement);
      const id = String(fd.get('id') || '');
      const payload = {
        woord: String(fd.get('woord') || ''),
        soort: String(fd.get('soort')) as Woordsoort,
        zin: String(fd.get('zin') || '') || undefined,
        active: String(fd.get('active')) === 'true',
      };
      void (async () => {
        try {
          if (id) {
            await updateWord(id, payload);
            this.setStatus('Woord opgeslagen.');
          } else {
            await createWord(payload);
            this.setStatus('Woord toegevoegd.');
          }
          this.editingWordId = null;
          this.words = await fetchWords(true);
          this.render();
        } catch (err) {
          this.setStatus(err instanceof Error ? err.message : 'Opslaan mislukt', true);
          this.render();
        }
      })();
    });
  }

  private renderTheory(main: HTMLElement): void {
    const editing = this.editingTheoryId
      ? this.theory.find((t) => t.id === this.editingTheoryId) ?? null
      : null;
    const nextOrder =
      this.theory.reduce((max, t) => Math.max(max, t.sort_order), 0) + 1;

    main.innerHTML = `
      <h2>Theorie</h2>
      <p class="lead">${this.theory.length} secties · HTML-body met preview</p>
      <button type="button" class="btn primary" data-action="new-theory" style="margin-bottom:1rem">Nieuwe sectie</button>
      <div class="split split-2">
        <form class="form-grid" data-theory-form>
          <input type="hidden" name="id" value="${escapeAttr(editing?.id ?? '')}" />
          <label>Volgorde <input name="sort_order" type="number" required value="${editing?.sort_order ?? nextOrder}" /></label>
          <label>Nr <input name="nr" required value="${escapeAttr(editing?.nr ?? String(nextOrder))}" /></label>
          <label>Titel <input name="title" required value="${escapeAttr(editing?.title ?? '')}" /></label>
          <label>Afkorting <input name="abbr" required value="${escapeAttr(editing?.abbr ?? '')}" /></label>
          <label>In-game soort
            <select name="in_game_soort">
              <option value="">— geen —</option>
              ${WOORDSOORTEN.map(
                (s) =>
                  `<option value="${s}" ${editing?.in_game_soort === s ? 'selected' : ''}>${escapeHtml(SOORT_LABELS[s])}</option>`,
              ).join('')}
            </select>
          </label>
          <label>Actief
            <select name="active">
              <option value="true" ${editing?.active !== false ? 'selected' : ''}>Ja</option>
              <option value="false" ${editing?.active === false ? 'selected' : ''}>Nee</option>
            </select>
          </label>
          <label class="full">Body HTML
            <textarea name="body_html" rows="12" required>${escapeHtml(editing?.body_html ?? '')}</textarea>
          </label>
          <div class="form-actions full">
            <button class="btn primary" type="submit">${editing ? 'Opslaan' : 'Toevoegen'}</button>
            ${editing ? `<button class="btn secondary" type="button" data-action="cancel-theory">Annuleren</button>` : ''}
          </div>
        </form>
        <div>
          <h3 style="margin-top:0">Preview</h3>
          <div class="preview-box" data-theory-preview>${editing ? theoryCardHtml(editing) : '<p class="muted">Selecteer of maak een sectie.</p>'}</div>
        </div>
      </div>
      <div class="table-wrap" style="margin-top:1rem">
        <table>
          <thead><tr><th>#</th><th>Titel</th><th>Soort</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${this.theory
              .map(
                (t) => `
              <tr>
                <td>${escapeHtml(t.nr)} <span class="muted">(${t.sort_order})</span></td>
                <td><strong>${escapeHtml(t.title)}</strong> <span class="muted">(${escapeHtml(t.abbr)})</span></td>
                <td>${t.in_game_soort ? escapeHtml(SOORT_LABELS[t.in_game_soort]) : '—'}</td>
                <td>${t.active ? '<span class="badge">Actief</span>' : '<span class="badge off">Uit</span>'}</td>
                <td class="row-actions">
                  <button type="button" data-edit-theory="${t.id}">Bewerk</button>
                  <button type="button" data-del-theory="${t.id}">Verwijder</button>
                </td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
      <p class="status ${this.statusError ? 'error' : ''}">${escapeHtml(this.status)}</p>`;

    const form = main.querySelector<HTMLFormElement>('[data-theory-form]')!;
    const preview = main.querySelector<HTMLElement>('[data-theory-preview]')!;
    const bodyField = form.elements.namedItem('body_html') as HTMLTextAreaElement;
    const titleField = form.elements.namedItem('title') as HTMLInputElement;
    const abbrField = form.elements.namedItem('abbr') as HTMLInputElement;
    const nrField = form.elements.namedItem('nr') as HTMLInputElement;
    const soortField = form.elements.namedItem('in_game_soort') as HTMLSelectElement;

    const refreshPreview = () => {
      preview.innerHTML = theoryCardHtml({
        id: editing?.id ?? 'preview',
        sort_order: Number((form.elements.namedItem('sort_order') as HTMLInputElement).value || 0),
        nr: nrField.value || '?',
        title: titleField.value || 'Titel',
        abbr: abbrField.value || '…',
        in_game_soort: (soortField.value || null) as Woordsoort | null,
        body_html: bodyField.value,
        active: true,
      });
    };
    bodyField.addEventListener('input', refreshPreview);
    titleField.addEventListener('input', refreshPreview);
    abbrField.addEventListener('input', refreshPreview);
    nrField.addEventListener('input', refreshPreview);
    soortField.addEventListener('change', refreshPreview);

    main.querySelector('[data-action="new-theory"]')?.addEventListener('click', () => {
      this.editingTheoryId = null;
      this.render();
    });
    main.querySelector('[data-action="cancel-theory"]')?.addEventListener('click', () => {
      this.editingTheoryId = null;
      this.render();
    });
    main.querySelectorAll<HTMLButtonElement>('[data-edit-theory]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.editingTheoryId = btn.dataset.editTheory ?? null;
        this.render();
      });
    });
    main.querySelectorAll<HTMLButtonElement>('[data-del-theory]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.delTheory!;
        if (!confirm('Theorie-sectie verwijderen?')) return;
        void (async () => {
          try {
            await deleteTheorySection(id);
            this.setStatus('Sectie verwijderd.');
            this.theory = await fetchTheorySections();
            if (this.editingTheoryId === id) this.editingTheoryId = null;
            this.render();
          } catch (err) {
            this.setStatus(err instanceof Error ? err.message : 'Verwijderen mislukt', true);
            this.render();
          }
        })();
      });
    });

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const id = String(fd.get('id') || '');
      const payload = {
        sort_order: Number(fd.get('sort_order')),
        nr: String(fd.get('nr') || ''),
        title: String(fd.get('title') || ''),
        abbr: String(fd.get('abbr') || ''),
        in_game_soort: (String(fd.get('in_game_soort') || '') || null) as Woordsoort | null,
        body_html: String(fd.get('body_html') || ''),
        active: String(fd.get('active')) === 'true',
      };
      void (async () => {
        try {
          if (id) {
            await updateTheorySection(id, payload);
            this.setStatus('Sectie opgeslagen.');
          } else {
            await createTheorySection(payload);
            this.setStatus('Sectie toegevoegd.');
          }
          this.editingTheoryId = null;
          this.theory = await fetchTheorySections();
          this.render();
        } catch (err) {
          this.setStatus(err instanceof Error ? err.message : 'Opslaan mislukt', true);
          this.render();
        }
      })();
    });
  }

  private renderUsers(main: HTMLElement): void {
    main.innerHTML = `
      <h2>Gebruikers</h2>
      <p class="lead">${this.players.length} spelers (read-only)</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Naam</th><th>E-mail</th><th>Groepen</th><th>Admin</th><th>Sinds</th></tr>
          </thead>
          <tbody>
            ${
              this.players.length === 0
                ? `<tr><td colspan="5" class="empty-state">Nog geen spelers.</td></tr>`
                : this.players
                    .map(
                      (p) => `
              <tr>
                <td><strong>${escapeHtml(p.display_name)}</strong><div class="muted" style="font-size:0.8rem">${escapeHtml(p.id)}</div></td>
                <td>${escapeHtml(p.email ?? '—')}</td>
                <td>${p.group_count}</td>
                <td>${p.is_admin ? '<span class="badge admin">Admin</span>' : '—'}</td>
                <td>${formatDate(p.created_at)}</td>
              </tr>`,
                    )
                    .join('')
            }
          </tbody>
        </table>
      </div>
      <p class="status ${this.statusError ? 'error' : ''}">${escapeHtml(this.status)}</p>`;
  }

  private renderGroups(main: HTMLElement): void {
    const selected = this.groups.find((g) => g.id === this.selectedGroupId) ?? null;
    main.innerHTML = `
      <h2>Groepen</h2>
      <p class="lead">${this.groups.length} groepen · selecteer voor leden en scores</p>
      <div class="split split-2">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Naam</th><th>Leden</th><th>Code</th><th>Sinds</th></tr></thead>
            <tbody>
              ${this.groups
                .map(
                  (g) => `
                <tr data-select-group="${g.id}" style="cursor:pointer;${g.id === this.selectedGroupId ? 'background:#eef6f2' : ''}">
                  <td><strong>${escapeHtml(g.name)}</strong></td>
                  <td>${g.member_count}</td>
                  <td><code>${escapeHtml(g.invite_code ?? '—')}</code></td>
                  <td>${formatDate(g.created_at)}</td>
                </tr>`,
                )
                .join('')}
            </tbody>
          </table>
        </div>
        <div>
          ${
            selected
              ? `
            <h3 style="margin-top:0">${escapeHtml(selected.name)}</h3>
            <p class="muted">Leden</p>
            <div class="table-wrap" style="margin-bottom:1rem">
              <table>
                <thead><tr><th>Speler</th><th>Rol</th><th>E-mail</th></tr></thead>
                <tbody>
                  ${this.groupMembers
                    .map(
                      (m) => `
                    <tr>
                      <td>${escapeHtml(m.display_name)}</td>
                      <td>${escapeHtml(m.role)}</td>
                      <td>${escapeHtml(m.email ?? '—')}</td>
                    </tr>`,
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
            <p class="muted">Recente scores</p>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Speler</th><th>Score</th><th>Rijen</th><th>Lvl</th><th>Datum</th></tr></thead>
                <tbody>
                  ${
                    this.groupScores.length === 0
                      ? `<tr><td colspan="5" class="empty-state">Nog geen scores.</td></tr>`
                      : this.groupScores
                          .map(
                            (s) => `
                    <tr>
                      <td>${escapeHtml(s.display_name)}</td>
                      <td>${s.score}</td>
                      <td>${s.lines}</td>
                      <td>${s.level}</td>
                      <td>${formatDate(s.created_at)}</td>
                    </tr>`,
                          )
                          .join('')
                  }
                </tbody>
              </table>
            </div>`
              : `<p class="empty-state">Selecteer een groep links.</p>`
          }
        </div>
      </div>
      <p class="status ${this.statusError ? 'error' : ''}">${escapeHtml(this.status)}</p>`;

    main.querySelectorAll<HTMLTableRowElement>('[data-select-group]').forEach((row) => {
      row.addEventListener('click', () => {
        const id = row.dataset.selectGroup!;
        void (async () => {
          try {
            await this.loadGroupDetail(id);
            this.render();
          } catch (err) {
            this.setStatus(err instanceof Error ? err.message : 'Groep laden mislukt', true);
            this.render();
          }
        })();
      });
    });
  }
}

function theoryCardHtml(section: TheorySection): string {
  const badge = section.in_game_soort
    ? `<span class="badge">In het spel</span>`
    : '';
  return `
    <article class="theory-card">
      <header>
        <strong>${escapeHtml(section.nr)}. ${escapeHtml(section.title)}</strong>
        <span class="muted">(${escapeHtml(section.abbr)})</span>
        ${badge}
      </header>
      <div>${section.body_html}</div>
    </article>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('nl-BE', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}
