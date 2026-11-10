import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isOnlineConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isOnlineConfigured) {
    throw new Error('Supabase is niet geconfigureerd (.env)');
  }
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Handmatig in consumeAuthRedirect, zodat PASSWORD_RECOVERY betrouwbaar is.
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    });
  }
  return client;
}
