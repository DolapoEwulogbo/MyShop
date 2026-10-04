# My Shop

A small e-commerce shop built with React + Vite, Supabase (database + auth), Google sign-in, Resend confirmation emails, and hosted on Vercel.

Companion documents:

* `PRD.md` — what the product is and the UX.
* `AGENTS.md` — architecture, layering rules and the build phases. `supabase/migrations/*.sql` is the schema source of truth.
* `SETUP.md` — the click-by-click dashboard steps (Supabase, Google Cloud, Resend, Vercel) that only you can do.

## What works today

* Browse products, open a product, add to cart, change quantities (cart persists in `localStorage`).
* Checkout form with client-side validation and per-field messages.
* `POST /api/create-order` — the only public endpoint. It verifies the Supabase access token, re-reads prices and stock server-side, writes the order through the `create_order` SQL function in one transaction, and sends a confirmation email via Resend (an email failure never cancels the order — the API returns `emailSent` so the Success page can be honest about it).

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
RESEND_API_KEY
RESEND_FROM            # optional; default is My Shop <onboarding@resend.dev>
```

In production the same values live in the Vercel project's Environment Variables. If a function cannot see them locally, run `vercel env pull .env.local` after adding them in Vercel.

## Run locally

Local development uses **two processes**: Vite serves the app, and the Vercel CLI serves the `/api/create-order` function. Vite proxies `/api` to the CLI, so the browser only ever talks to `http://localhost:3000` — one origin, like production.

Install the CLI once:

```bash
npm install
npm i -g vercel
vercel login     # once
vercel link      # once, to connect this folder to the Vercel project
```

Then run two terminals:

```bash
# Terminal A — the API only (ignore the app it serves; we use only its function runtime)
vercel dev --listen 3001

# Terminal B — the app
npm run dev      # http://localhost:3000
```

Open `http://localhost:3000`; requests to `/api/*` are proxied to `http://localhost:3001`.

`npm run dev` on its own still serves the storefront (products, cart, UI), but `/api/create-order` returns 404 until Terminal A is running. We do not run the app under `vercel dev`, because its rewrite handling breaks Vite's dev assets; the single `vercel.json` rewrite is kept for production only.

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
server/      server-only helpers imported by api/ (supabaseAdmin.js, validate.js)
src/         React app: components, pages, context, services, lib, utils
supabase/    migrations + seed
```

Documentation for the build order and the phase-by-phase test checklist lives in `AGENTS.md` (Sections 12-13).

