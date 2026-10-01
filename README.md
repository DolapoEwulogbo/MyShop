# My Shop

A small e-commerce shop built with React + Vite, Supabase (database + auth), Google sign-in, Mailgun confirmation emails, and hosted on Vercel.

Companion documents:

* `PRD.md` — what the product is and the UX.
* `AGENTS.md` — architecture, layering rules and the build phases. `supabase/migrations/*.sql` is the schema source of truth.
* `SETUP.md` — the click-by-click dashboard steps (Supabase, Google Cloud, Mailgun, Vercel) that only you can do.

## What works today

* Browse products, open a product, add to cart, change quantities (cart persists in `localStorage`).
* Checkout form with client-side validation and per-field messages.
* `POST /api/create-order` — the only public endpoint. It verifies the Supabase access token, re-reads prices and stock server-side, writes the order through the `create_order` SQL function, and sends the confirmation email as a best-effort step.

## Requirements

* Node.js 18 or newer (20+ recommended).
* A Supabase project with the migrations and seed applied (`SETUP.md` Part C).
* Google OAuth configured (`SETUP.md` Parts D-E) for sign-in.
* For local API development: the Vercel CLI (`npm i -g vercel`) — plain `npm run dev` does **not** serve `/api`.

## Environment variables

Copy `.env.example` to `.env.local` and fill it in. `.env.local` is gitignored — never commit it.

Browser (safe to expose, baked into the build — redeploy after changing):

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Server only (used by `api/` and `server/`; never prefix these with `VITE_`):

```text
SUPABASE_SERVICE_ROLE_KEY
MAILGUN_API_KEY
MAILGUN_DOMAIN
MAILGUN_FROM
MAILGUN_API_BASE_URL   # https://api.mailgun.net (US) or https://api.eu.mailgun.net (EU)
```

In production the same values live in the Vercel project's Environment Variables. If a function cannot see them locally, run `vercel env pull .env.local` after adding them in Vercel.

## Run locally

Frontend only (products, cart and storefront UI):

```bash
npm install
npm run dev
```

Full app including the `/api/create-order` function — use the Vercel CLI so functions and env vars are available:

```bash
vercel login     # once
vercel link      # once, to connect this folder to the Vercel project
vercel dev
```

## Build

```bash
npm run build    # outputs to dist/
npm run preview  # serve the production build locally
```

## Database

The SQL in `supabase/migrations/` is the schema source of truth; `supabase/seed.sql` fills sample products. Apply both in the Supabase SQL editor (see `SETUP.md` Part C). Money is stored as whole naira integers — format for display only via `src/utils/currency.js`.

## Deploy

Push to `main`; Vercel builds and deploys automatically. `vercel.json` rewrites all non-API routes to `index.html` so deep links such as `/cart` and `/checkout` work on refresh. Remember to redeploy after changing any `VITE_` value, and to keep the production URL in Supabase's Redirect URLs.

## Project structure

```text
api/         Vercel functions (only create-order.js is public)
server/      server-only helpers imported by api/ (e.g. email.js — Mailgun)
src/         React app: components, pages, context, services, lib, utils
supabase/    migrations + seed
```

Documentation for the build order and the phase-by-phase test checklist lives in `AGENTS.md` (Sections 12-13).

