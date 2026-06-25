# FitFlow Web

FitFlow is a workout + nutrition tracking app. This is the **web version** — a Next.js (React + TypeScript) port of the original iOS app, so you can work on it from any computer and deploy it for free.

It runs entirely in the browser and stores all data locally on the device (via `localStorage`). No backend or database is required.

## Features

- **Onboarding survey** — goal, fitness level, available equipment, focus areas, schedule
- **Smart workout generation** — recovery-aware plans built from a catalog of ~55 exercises
- **Active workout tracking** — per-set weight/reps logging, completion toggles, rest timer, automatic personal-record (1RM) detection
- **Progress dashboard** — streak, workout count, 12-week volume chart, muscle-recovery status, PRs
- **Diet tab** — calorie/macro targets (Mifflin–St Jeor), water tracking, meal logging, suggested recipes and meal plans
- **Profile** — units (imperial/metric), default rest timer, retake survey, sign out, reset data

> Note: features that depend on Apple-only frameworks in the original iOS app — the camera rep-counter (Vision), Apple HealthKit sync, and the Apple Watch companion — are **not** part of the web version, since those APIs don't exist in the browser.

## Run it locally

You'll need [Node.js](https://nodejs.org) 18+ installed.

```bash
cd web
npm install
npm run dev
```

Then open http://localhost:3000.

To make a production build:

```bash
npm run build
npm start
```

## Project structure

```
web/
├─ app/            Next.js App Router (layout, page, global CSS)
├─ components/     React UI (survey, home, workout, progress, diet, profile)
├─ lib/            Ported business logic (workout generator, nutrition,
│                  recovery, progression, records, catalogs, storage)
├─ package.json
├─ tailwind.config.ts
├─ tsconfig.json
├─ vercel.json     Vercel deploy config
└─ squadbase.yml   Squadbase deploy config
```

## Deploy for free — step by step

### 1. Put the code on GitHub

1. Create a free account at https://github.com if you don't have one.
2. Create a new **empty** repository (e.g. `fitflow-web`). Don't add a README — you already have one.
3. From a terminal inside the `web/` folder:

   ```bash
   git init
   git add .
   git commit -m "FitFlow web app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/fitflow-web.git
   git push -u origin main
   ```

### 2. Deploy on Vercel (free Hobby plan)

1. Go to https://vercel.com and sign in **with your GitHub account**.
2. Click **Add New… → Project**, then import your `fitflow-web` repository.
3. Vercel auto-detects Next.js. **If you pushed only the contents of `web/`**, leave the Root Directory as `./`. **If you pushed the whole project**, set the Root Directory to `web`.
4. Click **Deploy**. In ~1 minute you'll get a live URL like `https://fitflow-web.vercel.app`.

Every time you `git push`, Vercel redeploys automatically.

### 3. (Optional) Deploy on Squadbase

Squadbase also builds straight from your GitHub repo and supports Next.js on its free tier.

1. Go to https://www.squadbase.dev and sign in with GitHub.
2. Create a new app and select your `fitflow-web` repository.
3. The included `squadbase.yml` tells it to build as a Next.js app (Node 20). Confirm the build and deploy.

> You don't need both Vercel and Squadbase — pick whichever you prefer. Vercel is the most common choice for Next.js.

## Notes on your data

All data lives in the browser's `localStorage` under keys prefixed `ff.` (the same key names as the original app's storage). Clearing your browser data, or using the Profile → **Reset all data** button, erases it. Data does not sync between devices or browsers.
