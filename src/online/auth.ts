import { getSupabase, isOnlineConfigured } from './supabase';

export type AuthView = 'login' | 'register' | 'forgot' | 'updatePassword';

export interface AuthUserInfo {
  id: string;
  email: string;
  emailConfirmed: boolean;
}

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('email not confirmed')) {
    return 'Bevestig eerst je e-mail via de link in je inbox.';
  }
  if (m.includes('invalid login credentials')) {
    return 'Onjuiste e-mail of wachtwoord.';
  }
  if (m.includes('user already registered')) {
    return 'Dit e-mailadres is al geregistreerd. Log in of gebruik “Wachtwoord vergeten”.';
  }
  if (m.includes('password')) {
    return 'Wachtwoord voldoet niet (minstens 6 tekens).';
  }
  return message;
}

function appRedirectUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
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

export async function requireAuthSession(): Promise<AuthUserInfo> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error('Log eerst in met je e-mailadres.');
  }
  if (!user.emailConfirmed) {
    throw new Error('Bevestig eerst je e-mail via de link in je inbox.');
  }
  return user;
}

export async function registerWithEmail(
  email: string,
  password: string,
): Promise<{ needsEmailConfirm: boolean }> {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: appRedirectUrl() },
  });
  if (error) throw new Error(mapAuthError(error.message));

  const needsEmailConfirm = !data.session || !data.user?.email_confirmed_at;
  return { needsEmailConfirm };
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(mapAuthError(error.message));
}

export async function requestPasswordReset(email: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: appRedirectUrl(),
  });
  if (error) throw new Error(mapAuthError(error.message));
}

export async function updatePassword(newPassword: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.auth.updateUser({ password: newPassword });
  if (error) throw new Error(mapAuthError(error.message));
}

export async function logout(): Promise<void> {
  const sb = getSupabase();
  await sb.auth.signOut();
}

/**
 * Verwerkt bevestigings-/reset-links.
 * Wachtwoorden staan NOOIT in onze tabellen — alleen gehasht bij Supabase Auth.
 */
export async function consumeAuthRedirect(): Promise<AuthView | null> {
  if (!isOnlineConfigured) return null;

  const href = window.location.href;
  const url = new URL(href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  const type =
    url.searchParams.get('type') ?? hashParams.get('type') ?? undefined;

  const hasAuthPayload =
    url.searchParams.has('code') ||
    hashParams.has('access_token') ||
    hashParams.has('type');

  if (!hasAuthPayload) return null;

  const sb = getSupabase();
  // PKCE: ?code=... — detectSessionInUrl / getSession pikt dit op
  await sb.auth.getSession();

  history.replaceState(null, '', url.pathname + url.search.replace(/\?code=[^&]+/, '').replace(/\?$/, '') || url.pathname);

  if (type === 'recovery') {
    return 'updatePassword';
  }
  return null;
}
