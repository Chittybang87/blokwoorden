/**
 * Zet een Auth-wachtwoord via de Supabase Admin API (service_role).
 *
 * Gebruik (PowerShell):
 *   $env:SUPABASE_URL="https://xxxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."   # Project Settings → API → service_role
 *   node scripts/set-user-password.mjs tim.goossens@live.com "JouwNieuweWachtwoord"
 *
 * Nooit de service_role key in .env van de frontend zetten of committen.
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];
const password = process.argv[3];

if (!url || !serviceKey) {
  console.error(`
Ontbrekende env:
  SUPABASE_URL              (of VITE_SUPABASE_URL)
  SUPABASE_SERVICE_ROLE_KEY (Dashboard → Project Settings → API → service_role)

PowerShell voorbeeld:
  $env:SUPABASE_URL="https://xxxx.supabase.co"
  $env:SUPABASE_SERVICE_ROLE_KEY="plak-hier-de-secret"
  node scripts/set-user-password.mjs tim.goossens@live.com "NieuwWachtwoord123"
`);
  process.exit(1);
}

if (!email || !password) {
  console.error(
    'Gebruik: node scripts/set-user-password.mjs <email> "<nieuw-wachtwoord>"',
  );
  process.exit(1);
}

if (password.length < 6) {
  console.error('Wachtwoord moet minstens 6 tekens zijn.');
  process.exit(1);
}

const sb = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: listed, error: listError } = await sb.auth.admin.listUsers({
  page: 1,
  perPage: 200,
});

if (listError) {
  console.error('Users ophalen mislukt:', listError.message);
  process.exit(1);
}

const user = listed.users.find(
  (u) => u.email?.toLowerCase() === email.trim().toLowerCase(),
);

if (!user) {
  console.error(`Geen Auth-user gevonden voor ${email}`);
  process.exit(1);
}

const { data, error } = await sb.auth.admin.updateUserById(user.id, {
  password,
  email_confirm: true,
});

if (error) {
  console.error('Wachtwoord zetten mislukt:', error.message);
  process.exit(1);
}

console.log(`OK — wachtwoord gezet voor ${data.user.email} (${data.user.id})`);
console.log('Log nu in op http://localhost:5174');
console.log(`
Daarna admin-rechten (SQL Editor):
  update public.players
  set is_admin = true
  where id = '${data.user.id}';
`);
