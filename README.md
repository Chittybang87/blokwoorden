# Blokwoorden

Woordenschat-puzzel in de browser: stapel woordkaarten, sluit een rij en beantwoord de **Taal-Check**. Goed antwoord ruimt de rij op; fout antwoord wordt een grijze muur.

## Spelen

```bash
npm install
npm run dev
```

Open de getoonde URL (meestal `http://localhost:5173`).

Productiebuild:

```bash
npm run build
npm run preview
```

## Besturing

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

## Online groepen (Supabase)

1. Kopieer `.env.example` naar `.env` en vul `VITE_SUPABASE_URL` + Publishable/anon key in.
2. In Supabase → **SQL Editor**: voer [`supabase/schema.sql`](supabase/schema.sql) uit.
3. **Authentication → Providers → Email**: aan; **Confirm email** aan; **Anonymous** uit.
4. **Authentication → URL Configuration**: Site URL + Redirect URLs = je app (bv. `http://localhost:5173` en later je Vercel-URL).
5. Start de app → **Speel in een groep** → account maken / inloggen / wachtwoord vergeten.

Wachtwoorden worden alleen door Supabase Auth gehasht opgeslagen — niet in onze `players`-tabel en niet zichtbaar in de app.

De UI is touch-vriendelijk en later te verpakken met Capacitor voor Android/tablet.
