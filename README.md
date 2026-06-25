# FitFlow (web)

Personalized workouts, smart progression, and nutrition tracking. Next.js 14 + React.
Data is stored in the browser (localStorage) and, when Supabase is configured,
synced to the cloud with real email/password accounts.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

The app runs with zero config in **local-only mode** (data stays in the browser).

## Enable cloud accounts (Supabase)

1. Create a free project at https://supabase.com.
2. In the project: **SQL Editor -> New query**, paste `supabase/schema.sql`, **Run**.
3. (For easy testing) **Authentication -> Sign In / Providers -> Email**: turn OFF
   "Confirm email" so new sign-ups log in immediately. (Re-enable later if you want.)
4. **Project Settings -> API**: copy the **Project URL** and **anon public** key.
5. Copy `.env.local.example` to `.env.local` and fill those two values:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

6. `npm run dev` again — the welcome screen now shows real sign up / sign in,
   and all data syncs to Supabase per user.

## Deploy (Vercel)

- Import the repo at https://vercel.com/new (framework auto-detects as Next.js).
- Add the same two `NEXT_PUBLIC_SUPABASE_*` env vars under **Environment Variables**.
- Deploy.

## How sync works

localStorage stays the synchronous source of truth for the UI. On sign-in the app
pulls every `ff.*` blob from the `user_data` table into localStorage; every
subsequent write is mirrored back up. Row Level Security keeps each user's rows private.
