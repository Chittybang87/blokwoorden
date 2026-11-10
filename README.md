# Blokwoorden

Woordenschat-puzzel in de browser: stapel woordkaarten, sluit een rij en beantwoord de **Taal-Check**. Goed antwoord ruimt de rij op; fout antwoord wordt een grijze muur.

Monorepo:

```text
apps/game     → spel (leerlingen)
apps/admin    → beheer (globale admins)
packages/shared
supabase/     → schema.sql + seed.sql
```

## Lokaal spelen / beheren

```bash
npm install
npm run dev:game    # http://localhost:5173
npm run dev:admin   # http://localhost:5174
```

Kopieer [`.env.example`](.env.example) naar `apps/game/.env` en `apps/admin/.env` en vul Supabase-keys in.

Productiebuild:

```bash
npm run build:game
npm run build:admin
```

## Besturing (spel)

- **Pijltjes / WASD** — bewegen en draaien
- **Spatie** — direct neer
- **1–4** — antwoord bij Taal-Check
- Op tablet/telefoon: knoppen onder het speelveld

## Functies

- Woord per vallend blok, kleur per woordsoort
- Taal-Check met timer bij een volle rij
- Grijze muur bij fout antwoord
- Grammatica-Chain combo bij meerdere rijen
- Perfect Match-bonus bij passende woordsoorten boven elkaar
- Groepen met korte code + QR en groepsleaderboard (Supabase)
- Beheerapp voor woorden, theorie, gebruikers en groepen

## Supabase setup

1. Vul `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `apps/game/.env` en `apps/admin/.env`.
2. In Supabase → **SQL Editor**: voer [`supabase/schema.sql`](supabase/schema.sql) uit.
3. Voer daarna [`supabase/seed.sql`](supabase/seed.sql) uit (woorden + theorie).
4. **Authentication → Providers → Email**: aan; **Confirm email** aan; **Anonymous** uit.
5. **Authentication → URL Configuration**:
   - **Site URL**: productie-URL van het spel
   - **Redirect URLs**: lokale + Vercel URLs voor **game én admin**  
     (bv. `http://localhost:5173`, `http://localhost:5174`, `https://….vercel.app`, `https://….vercel.app` voor admin)
6. Maak een account in de game of admin, zorg dat er een `players`-rij bestaat (spel → groep / `ensure_player`), en flag admin:

```sql
update public.players
set is_admin = true
where id = (select id from auth.users where email = 'jouw@email.be');
```

Wachtwoorden staan alleen gehasht in Supabase Auth — nooit in `players`.

Content (woorden/theorie) wordt door het spel uit Supabase geladen; bij ontbrekende config of lege tabellen valt het terug op de gebundelde data in de repo.

## Beheerapp

Alleen accounts met `players.is_admin = true` krijgen toegang.

Schermen:

- **Woorden** — toevoegen, wijzigen, deactiveren/verwijderen
- **Theorie** — secties met HTML-body + preview
- **Gebruikers** — overzicht (naam, e-mail, groepen, admin-flag)
- **Groepen** — leden + recente scores (read-only)

## Deploy op Vercel (twee projecten, één repo)

Omdat game en admin aparte URLs hebben: maak **twee Vercel-projecten** op dezelfde Git-repo.

### Aanbevolen (workspaces vanaf root)

Voor **beide** projecten:

| Setting | Spel | Admin |
|---------|------|-------|
| Root Directory | `.` (repo root) | `.` (repo root) |
| Framework | Vite | Vite |
| Build Command | `npm run build:game` | `npm run build:admin` |
| Output Directory | `apps/game/dist` | `apps/admin/dist` |
| Install Command | `npm install` | `npm install` |

Environment variables (beide projecten):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Gebruik **geen** service-role key in Vercel. Admins schrijven via de anon key + RLS (`is_admin()`).

### Stappen

1. Push deze repo naar GitHub/GitLab.
2. Vercel → **Add New Project** → kies de repo → vul de game-settings hierboven in → Deploy.
3. Vercel → **Add New Project** opnieuw → **zelfde repo** → admin-settings → Deploy.
4. Voeg beide productie- (en preview-)URLs toe aan Supabase **Redirect URLs**.
5. Optioneel: custom domains, bv. `blokwoorden.be` en `admin.blokwoorden.be`.

Na deploy: log in op de admin-URL met een geflagd admin-account.

## Seed opnieuw genereren

Als `apps/game/src/data/words.json` of de fallback-theorie wijzigt:

```bash
node scripts/generate-seed.mjs
```

Voer het nieuwe `supabase/seed.sql` alleen uit op een lege content-tabel (het script is idempotent zolang er nog geen rijen in `words` / `theory_sections` staan).
