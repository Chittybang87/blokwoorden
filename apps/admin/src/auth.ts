import { getSupabase, isOnlineConfigured } from './supabase';

export type AuthView = 'login' | 'forgot' | 'updatePassword';

export interface AuthUserInfo {
  id: string;
  email: string;
  emailConfirmed: boolean;
}

const RECOVERY_KEY = 'bw_admin_pw_recovery';

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('email not confirmed')) {
    return 'Bevestig eerst je e-mail via de link in je inbox.';
  }
  if (m.includes('invalid login credentials')) {
    return 'Onjuiste e-mail of wachtwoord.';
  }
  if (m.includes('rate limit') || m.includes('over_email_send_rate_limit')) {
    return 'Te veel e-mails verstuurd. Wacht even, of zet je wachtwoord via Supabase Dashboard (Authentication → Users).';
  }
  if (m.includes('password')) {
    return 'Wachtwoord voldoet niet (minstens 6 tekens).';
  }
  return message;
}

function appRedirectUrl(): string {
  return `${window.location.origin}/`;
}

export function markPasswordRecoveryPending(): void {
  sessionStorage.setItem(RECOVERY_KEY, '1');
}

export function clearPasswordRecoveryPending(): void {
  sessionStorage.removeItem(RECOVERY_KEY);
}

export function isPasswordRecoveryPending(): boolean {
  return sessionStorage.getItem(RECOVERY_KEY) === '1';
}

export async function getAuthUser(): Promise<AuthUserInfo | null> {
  if (!isOnlineConfigured) return null;
  const sb = getSupabase();
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user?.email) return null;
  return {
    id: data.user.id,
    email: data.user.email,
    emailConfirmed: Boolean(data.user.email_confirmed_at),
  };
}

export async function loginWithEmail(email: string, password: string): Promise<void> {
  clearPasswordRecoveryPending();
  const sb = getSupabase();
  const { error } = await sb.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(mapAuthError(error.message));
}

export async function requestPasswordReset(email: string): Promise<void> {
  const sb = getSupabase();
  markPasswordRecoveryPending();
  const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: appRedirectUrl(),
  });
  if (error) throw new Error(mapAuthError(error.message));
}

export async function updatePassword(newPassword: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.auth.updateUser({ password: newPassword });
  if (error) throw new Error(mapAuthError(error.message));
  clearPasswordRecoveryPending();
}

export async function logout(): Promise<void> {
  const sb = getSupabase();
  clearPasswordRecoveryPending();
  await sb.auth.signOut();
}

export type AuthRedirectResult = {
  view: AuthView | null;
  error: string | null;
  /** True als we een auth-code/token uit de URL verwerkten. */
  fromLink: boolean;
};

/**
 * Admin-app: een ?code= uit een e-maillink is in de praktijk altijd
 * wachtwoord-reset (registratie gebeurt in het spel). Na succesvolle
 * exchange tonen we dus altijd het "nieuw wachtwoord"-scherm.
 */
export async function consumeAuthRedirect(): Promise<AuthRedirectResult> {
  if (!isOnlineConfigured) {
    return { view: null, error: null, fromLink: false };
  }

  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  const type =
    url.searchParams.get('type') ?? hashParams.get('type') ?? undefined;
  const code = url.searchParams.get('code');
  const hasAuthPayload =
    Boolean(code) ||
    hashParams.has('access_token') ||
    hashParams.has('type') ||
    url.searchParams.has('token_hash');

  if (!hasAuthPayload) {
    return { view: null, error: null, fromLink: false };
  }

  const sb = getSupabase();
  let sawRecoveryEvent = false;
  const {
    data: { subscription },
  } = sb.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      sawRecoveryEvent = true;
      markPasswordRecoveryPending();
    }
  });

  try {
    if (code) {
      const { error } = await sb.auth.exchangeCodeForSession(code);
      if (error) {
        return {
          view: null,
          error: mapAuthError(error.message),
          fromLink: true,
        };
      }
    } else if (url.searchParams.has('token_hash') && type) {
      const tokenHash = url.searchParams.get('token_hash')!;
      const { error } = await sb.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as 'recovery' | 'email',
      });
      if (error) {
        return {
          view: null,
          error: mapAuthError(error.message),
          fromLink: true,
        };
      }
    } else {
      await sb.auth.getSession();
    }

    await new Promise((r) => setTimeout(r, 400));

    const user = await getAuthUser();
    if (!user) {
      return {
        view: null,
        error:
          'Resetlink kon niet worden geopend. Open de link in dezelfde browser waarin je “Wachtwoord vergeten” klikte (PKCE), of zet het wachtwoord via Supabase Dashboard.',
        fromLink: true,
      };
    }

    // Op de admin-app behandelen we e-maillinks als wachtwoordreset.
    markPasswordRecoveryPending();
    return { view: 'updatePassword', error: null, fromLink: true };
  } catch (err) {
    return {
      view: null,
      error: err instanceof Error ? err.message : 'Auth-link mislukt',
      fromLink: true,
    };
  } finally {
    subscription.unsubscribe();
    history.replaceState(null, '', url.pathname || '/');
    void sawRecoveryEvent;
  }
}

export async function checkIsAdmin(): Promise<boolean> {
  if (!isOnlineConfigured) return false;
  const sb = getSupabase();
  const { data, error } = await sb.rpc('am_i_admin');
  if (error) {
    const user = await getAuthUser();
    if (!user) return false;
    const { data: row } = await sb
      .from('players')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();
    return Boolean(row?.is_admin);
  }
  return Boolean(data);
}
