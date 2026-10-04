# SETUP.md - things YOU do by hand

An AI coding agent can write code, but it can't log in to websites for you. Do these in order. Dashboard menus change over time; if a label differs slightly, look for the closest match.

Keep a private note (not in the repo) with every value you collect.

---

## Part A - Tools on your computer (Phase 0)

1. **Node.js LTS** from nodejs.org. Check: `node -v` and `npm -v` in a terminal.
2. **Git** from git-scm.com. Check: `git --version`. Set your identity once:
   `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"`.
3. **VS Code** (you have it). Open the `my-shop` folder in it.
4. **Accounts** (free tiers): GitHub, Supabase, Google Cloud, Resend, Vercel (sign up to Vercel with GitHub).
5. Later, in Phase 6: `npm i -g vercel`.

---

## Part B - Supabase project (before Phase 4)

1. supabase.com → **New project**. Pick the closest available region and save the database password somewhere safe.
2. Wait for it to finish creating. Don't run SQL yet - see Part C.
3. Collect from **Project Settings → API** (may be labelled "API Keys"):
   * **Project URL** → `VITE_SUPABASE_URL`
   * **anon / publishable key** → `VITE_SUPABASE_ANON_KEY`
   * **service_role / secret key** → `SUPABASE_SERVICE_ROLE_KEY` (**private - never in frontend code, never in Git**)

## Part C - Create the database (Phase 4)

In Supabase → **SQL Editor** → New query. Run these three, **one at a time, in this order**, pasting each file's contents:

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_create_order_function.sql`
3. `supabase/seed.sql` (run this once only; running it twice duplicates products)

Check: **Table Editor** shows `profiles`, `products` (8 rows), `orders`, `order_items`, and each shows RLS enabled.

---

## Part D - Google Cloud OAuth (Phase 5)

1. console.cloud.google.com → create a **new project** (e.g. "my-shop").
2. Open **Google Auth Platform** (older UI: *APIs & Services → OAuth consent screen*) and configure:
   app name, your support email, audience **External**, your contact email.
3. **Get the Supabase callback URL first:** Supabase → **Authentication → Providers → Google**. Copy the **Callback URL** shown there (looks like `https://<project-ref>.supabase.co/auth/v1/callback`).
4. In Google Cloud → **Clients → Create client** → type **Web application** → under **Authorised redirect URIs** paste the Supabase callback URL → Create.
5. Copy the **Client ID** and **Client secret**.
6. Back in Supabase → Authentication → Providers → **Google**: enable it, paste Client ID and Client secret, Save.
7. **Test users:** while the app's publishing status is *Testing*, only accounts listed as test users can sign in. Add your own Google account(s) (and a second one for the "can't see other people's orders" test). Before showing the site to anyone else, **Publish app** in the Audience settings.

## Part E - Supabase redirect URLs (Phase 5)

Supabase → **Authentication → URL Configuration**:

* **Site URL:** your deployed Vercel URL (e.g. `https://my-shop-indol-eight.vercel.app`). Supabase falls back to the Site URL when a `redirectTo` isn't allow-listed, so this must be the production URL - not a localhost one. Localhost origins belong in the Redirect URLs only.
* **Redirect URLs** (add all):
  * `http://localhost:3000/**`
  * `http://localhost:5173/**`
  * `https://my-shop-indol-eight.vercel.app/**`

Remember: Google gets the **Supabase** callback; Supabase gets **your app's** URLs. They are different.

---

## Part F - GitHub + Vercel (end of Phase 1)

1. Create an empty GitHub repo (no README). In your project folder:
   `git init`, `git add .`, `git commit -m "chore: initial setup"`, then the `git remote add origin ...` and `git push -u origin main` commands GitHub shows you.
2. vercel.com → **Add New → Project** → import the repo → Framework preset **Vite** → Deploy.
3. Open the deployed URL. Test that visiting `/cart` directly (or refreshing on it) doesn't 404.
4. In **Vercel → Project → Settings → Environment Variables**, add (as they become available): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`.
5. **After adding or changing any `VITE_` variable, redeploy** - they're baked in at build time.
6. Add the Vercel URL to Supabase redirect URLs (Part E).

## Part G - Resend (before Phase 7)

Mailgun now requires payment, so the shop uses **Resend** (free tier: 3,000 emails/month, 100/day) instead. Sign up and set up:

1. Go to resend.com → **Sign up** (Google or GitHub is fine).
2. **API Keys** → **Create API Key** → name it `my-shop` → permission **Full access** → copy the key (starts with `re_`) → this is `RESEND_API_KEY` (**private**).
3. **Testing without a domain:** the default sender `My Shop <onboarding@resend.dev>` delivers **only to the email address on your Resend account**. Put your own email in the checkout form when testing. Orders using other addresses won't receive mail until step 4.
4. **Optional (real sending):** **Domains → Add Domain**, follow the DNS steps (needs a domain you control), then set `RESEND_FROM` to something like `My Shop <orders@yourdomain.com>`.

---

## Part H - Local environment file

In the project root, copy `.env.example` to `.env.local` and fill in the values. Confirm `.env.local` is listed in `.gitignore` (it is) and that `git status` never shows it.

## Part I - Mobile app on your phone (mobile assignment)

The mobile app lives in `mobile/` (Expo / React Native). It uses the SAME Supabase project, the SAME `cart_items` table and the SAME production `/api/create-order` endpoint as the website, which is what makes login and the cart shared between them.

**Step 1 - Env file.** In `mobile/`, copy `.env.example` to `.env` and fill in the real values (same Supabase values as the root `.env.local`; `EXPO_PUBLIC_API_BASE_URL` is the Vercel URL). `.env` is already in `mobile/.gitignore`.

**Step 2 - Install Expo Go on your phone** (free, from the App Store / Play Store). Your phone and computer must be on the **same Wi-Fi**.

**Step 3 - Start the app.** In the `mobile/` folder run:

```
npx expo start
```

A QR code appears. Scan it with your phone's camera (Android: scan from inside the Expo Go app). The app loads on your phone.

**Step 4 - Allow the Google sign-in redirect (Supabase dashboard).** On recent iOS versions (iOS 26+), Safari and the in-app auth session refuse to return to Expo Go through an `exp://` link, so the app completes Google sign-in on an `expo.dev` web address instead (a universal link Expo Go is entitled to handle). That address must be allowed in Supabase:

1. Supabase → **Authentication → URL Configuration → Redirect URLs**.
2. **Add URL** and paste exactly:
   `https://expo.dev/expo-go/auth/callback`
3. **Save.**

(In a real app build - not Expo Go - the app uses its own `myshop://` scheme instead, and `myshop://auth/callback` goes in this list. The app handles this automatically.)

**Step 5 - Test the assignment (do this and check each box):**

- [ ] App opens on the phone and shows the same products as the website
- [ ] Sign in with Google **on the phone** - a Google page opens inside the app, then it returns to the app signed in
- [ ] **The instant-sync test:** with the SAME Google account signed in on both, add an item to the cart on the **website** - the phone's cart updates within a second or two. Then change the quantity on the phone and watch the website update
- [ ] Place an order from the phone (same form as the website; the confirmation email goes to the same inbox)
- [ ] The order appears under "Orders" on the phone and on the website

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
| Phone can't reach the server / "Network request failed" | Phone and computer not on the same Wi-Fi - restart `npx expo start` |
| Google sign-in shows "Safari can't open the page..." on the phone | iOS blocks `exp://` links. Make sure the `https://expo.dev/expo-go/auth/callback` URL from Step 4 is in Supabase Redirect URLs, and reload the app so it runs the latest code |
| Cart on the phone doesn't match the website | You are signed in with DIFFERENT Google accounts on each - sign in with the same one on both |
| "Unable to resolve module" on the phone | A dependency is missing - run `npx expo install` in `mobile/` |
