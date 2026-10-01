# SETUP.md — things YOU do by hand

An AI coding agent can write code, but it can't log in to websites for you. Do these in order. Dashboard menus change over time; if a label differs slightly, look for the closest match.

Keep a private note (not in the repo) with every value you collect.

---

## Part A — Tools on your computer (Phase 0)

1. **Node.js LTS** from nodejs.org. Check: `node -v` and `npm -v` in a terminal.
2. **Git** from git-scm.com. Check: `git --version`. Set your identity once:
   `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"`.
3. **VS Code** (you have it). Open the `my-shop` folder in it.
4. **Accounts** (free tiers): GitHub, Supabase, Google Cloud, Mailgun, Vercel (sign up to Vercel with GitHub).
5. Later, in Phase 6: `npm i -g vercel`.

---

## Part B — Supabase project (before Phase 4)

1. supabase.com → **New project**. Pick the closest available region and save the database password somewhere safe.
2. Wait for it to finish creating. Don't run SQL yet — see Part C.
3. Collect from **Project Settings → API** (may be labelled "API Keys"):
   * **Project URL** → `VITE_SUPABASE_URL`
   * **anon / publishable key** → `VITE_SUPABASE_ANON_KEY`
   * **service_role / secret key** → `SUPABASE_SERVICE_ROLE_KEY` (**private — never in frontend code, never in Git**)

## Part C — Create the database (Phase 4)

In Supabase → **SQL Editor** → New query. Run these three, **one at a time, in this order**, pasting each file's contents:

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_create_order_function.sql`
3. `supabase/seed.sql` (run this once only; running it twice duplicates products)

Check: **Table Editor** shows `profiles`, `products` (8 rows), `orders`, `order_items`, and each shows RLS enabled.

---

## Part D — Google Cloud OAuth (Phase 5)

1. console.cloud.google.com → create a **new project** (e.g. "my-shop").
2. Open **Google Auth Platform** (older UI: *APIs & Services → OAuth consent screen*) and configure:
   app name, your support email, audience **External**, your contact email.
3. **Get the Supabase callback URL first:** Supabase → **Authentication → Providers → Google**. Copy the **Callback URL** shown there (looks like `https://<project-ref>.supabase.co/auth/v1/callback`).
4. In Google Cloud → **Clients → Create client** → type **Web application** → under **Authorised redirect URIs** paste the Supabase callback URL → Create.
5. Copy the **Client ID** and **Client secret**.
6. Back in Supabase → Authentication → Providers → **Google**: enable it, paste Client ID and Client secret, Save.
7. **Test users:** while the app's publishing status is *Testing*, only accounts listed as test users can sign in. Add your own Google account(s) (and a second one for the "can't see other people's orders" test). Before showing the site to anyone else, **Publish app** in the Audience settings.

## Part E — Supabase redirect URLs (Phase 5)

Supabase → **Authentication → URL Configuration**:

* **Site URL:** your Vercel URL once you have it (use `http://localhost:3000` until then).
* **Redirect URLs** (add all):
  * `http://localhost:3000/**`
  * `http://localhost:5173/**`
  * `https://<your-project>.vercel.app/**`

Remember: Google gets the **Supabase** callback; Supabase gets **your app's** URLs. They are different.

---

## Part F — GitHub + Vercel (end of Phase 1)

1. Create an empty GitHub repo (no README). In your project folder:
   `git init`, `git add .`, `git commit -m "chore: initial setup"`, then the `git remote add origin ...` and `git push -u origin main` commands GitHub shows you.
2. vercel.com → **Add New → Project** → import the repo → Framework preset **Vite** → Deploy.
3. Open the deployed URL. Test that visiting `/cart` directly (or refreshing on it) doesn't 404.
4. In **Vercel → Project → Settings → Environment Variables**, add (as they become available): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM`, `MAILGUN_API_BASE_URL`.
5. **After adding or changing any `VITE_` variable, redeploy** — they're baked in at build time.
6. Add the Vercel URL to Supabase redirect URLs (Part E).

## Part G — Mailgun (before Phase 7)

Plan limits and sandbox rules change; check Mailgun's current terms on its pricing and docs pages.

1. Sign up at mailgun.com. Note whether your account is **US** or **EU** (the dashboard/API URL shows it). Set `MAILGUN_API_BASE_URL` to `https://api.mailgun.net` (US) or `https://api.eu.mailgun.net` (EU).
2. **Sending → Domains:** use the provided **sandbox domain** (looks like `sandboxXXXX.mailgun.org`) → `MAILGUN_DOMAIN`.
3. **Sandbox restriction:** sandbox domains normally deliver **only to recipients you've added as authorised recipients**. Add your own email (and any test emails) and click the verification link Mailgun emails you. Orders using other addresses won't receive mail until you add a verified custom domain (needs DNS records you control; optional for this assignment).
4. Create an **API key** in Mailgun's API keys settings → `MAILGUN_API_KEY` (private).
5. `MAILGUN_FROM` example: `My Shop <postmaster@sandboxXXXX.mailgun.org>`.

---

## Part H — Local environment file

In the project root, copy `.env.example` to `.env.local` and fill in the values. Confirm `.env.local` is listed in `.gitignore` (it is) and that `git status` never shows it.

## Troubleshooting (most common)

| Symptom | Likely cause |
|---|---|
| `/api/create-order` returns 404 locally | You ran `npm run dev`. Use `vercel dev` |
| Function says env var undefined | Add to `.env.local`, or `vercel env pull .env.local`; on Vercel, add then **redeploy** |
| Google says "redirect_uri_mismatch" | Google's redirect URI must be exactly Supabase's callback URL |
| Google blocks sign-in for a user | App is in Testing and the account isn't a test user, or publish the app |
| After login you land on the wrong site / error | App URL missing from Supabase Redirect URLs |
| Page refresh 404s on Vercel | `vercel.json` missing or not deployed |
| Email never arrives | Recipient not an authorised sandbox recipient; wrong region base URL; check spam |
| First order fails with a foreign-key/permission error | Migrations not run in order, or run `001` and `002` again after fixing |
