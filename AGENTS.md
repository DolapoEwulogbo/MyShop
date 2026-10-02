# AGENTS.md — E-Commerce Shop

How to build this project. `PRD.md` says WHAT/UX; this file says HOW; `SETUP.md` lists the steps the owner must do by hand in dashboards.
Precedence if they conflict: `supabase/migrations/*.sql` (schema) > `AGENTS.md` > `PRD.md`. If still unclear, ask — don't guess.

---

## 0. Working agreement (read first, follow always)

The owner is a **complete beginner** building this to learn and to satisfy this assignment:
*"Build a website for a shop. Add a checkout page. Persist everything in a database using Supabase. Send confirmation emails using Mailgun. Do Google auth using Google Cloud Console."*

1. **One phase at a time** (Section 12). At the end of a phase: stop, list exactly what to verify by hand, and wait for "continue".
2. **Explain as you go.** Before creating files, say in 1–3 lines what you're building and why. After, give a one-sentence purpose per new file.
3. **Dashboard work is a human step** (Supabase, Google Cloud, Mailgun, Vercel, GitHub). Point to the matching section of `SETUP.md` and give exact click-by-click steps. Never claim you did it. Never invent keys, URLs or IDs — use placeholders.
4. **Ask before adding any dependency.** Pre-approved: `react`, `react-router-dom`, `@supabase/supabase-js`. Everything else needs a question first. (Vercel CLI is installed globally, not as a dependency.)
5. **Never print, log or commit secrets.** Secrets live only in `.env.local` (gitignored) and Vercel's env settings.
6. **Show real errors.** When something fails, show the actual error, explain it plainly, fix the root cause. Don't hide failures with empty `catch` blocks.
7. **Stay in scope.** Build only what's in the PRD MVP. Put new ideas in a "Later" list; don't build them.
8. **Git:** after each working phase, give the owner the exact `git add/commit` commands (conventional messages). The owner runs them.
9. **Don't pretend to have tested.** Say what you ran and what you saw. If you couldn't run something, say so.

---

## 1. Stack

* React + Vite, JavaScript, React Router, plain CSS (`src/index.css`)
* Supabase: Postgres, Auth, Row Level Security
* Supabase Auth with Google OAuth (credentials from Google Cloud Console)
* Vercel Functions (`api/`) for server logic; Vercel for hosting
* Mailgun for email, called with plain `fetch` (no SDK)
* GitHub for source control

## 2. Architecture

```text
Browser (React) ──read products/orders──▶ Supabase (RLS: read-only for customers)
      │  ▲
      │  └── Supabase Auth ◀──▶ Google
      │
      └─ POST /api/create-order (Bearer token) ─▶ Vercel Function
                                                    ├─▶ Supabase: rpc create_order (service role, one transaction)
                                                    └─▶ Mailgun: confirmation email (failure never cancels the order)
```

Responsibilities: React = UI only, no secrets. Supabase = data, auth, read-authorization. Vercel Function = anything needing secrets or trust (pricing, stock, order writes, email). Mailgun = delivery only.

## 3. Repository structure

```text
my-shop/
├── api/
│   └── create-order.js          # the ONLY public endpoint
├── server/                      # server-only helpers, imported by api/ (NOT public)
│   ├── supabaseAdmin.js
│   ├── email.js                 # Mailgun via fetch
│   └── validate.js
├── public/
├── src/
│   ├── components/  Navbar, ProductCard, ProductGrid, CartItem, CartSummary, Loading, ErrorMessage
│   ├── pages/       Home, Product, Cart, Checkout, Login, Success, Orders, Account
│   ├── context/     AuthContext, CartContext
│   ├── lib/         supabase.js
│   ├── services/    productService, orderService, authService
│   ├── utils/       currency.js, validation.js
│   ├── App.jsx  main.jsx  index.css
├── supabase/
│   ├── migrations/  001_schema.sql, 002_create_order_function.sql
│   └── seed.sql
├── .env.example  .gitignore  vercel.json  package.json  README.md
├── AGENTS.md  PRD.md  SETUP.md
```

There is deliberately **no** `send-order-email.js` endpoint: anything in `api/` is publicly callable, so an email endpoint would let strangers send mail from the owner's Mailgun account. Email is a helper in `server/email.js`, called only from `create-order.js`.

Because `package.json` has `"type": "module"` (Vite default), functions use ESM: `export default async function handler(req, res) { ... }`.

## 4. Layering rule

`Pages → Components → Services → Supabase / API`. No database queries inside components. Reuse services; never duplicate a query.

## 5. Routes

| Route | Page | Notes |
|---|---|---|
| `/` | Home | product grid |
| `/products/:id` | Product | details + quantity + add to cart |
| `/cart` | Cart | |
| `/login` | Login | "Continue with Google" |
| `/checkout` | Checkout | requires auth; redirect to `/login`, then back |
| `/success/:orderId` | Success | order placed |
| `/orders` | Orders | requires auth; own orders only |
| `/account` | Account | name, email, link to orders, sign out |

## 6. Database

**The SQL files in `supabase/migrations/` are the source of truth. Do not redesign the schema; if a change is needed, propose a new migration file.**

Tables: `profiles` (auto-created by trigger on first sign-in), `products`, `orders`, `order_items`. Orders have `order_number` (human-friendly), `idempotency_key`, customer name/email/phone/delivery address, `total_amount`, `status` (default `pending`). `order_items.price` is the price at purchase time — historical orders must display it, never the current product price.

**Money:** integer whole naira everywhere (`15000` = ₦15,000), no decimals, no floats. Format only for display via `utils/currency.js` → `new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })`.

**RLS:** customers can only `SELECT` — products (all), own orders, own order items, own profile. There are no insert/update/delete policies for customers. All order writes go through the `create_order` SQL function, which only `service_role` may execute.

## 7. Auth

* `authService.signInWithGoogle(returnPath)` → `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + returnPath } })`.
* Google Cloud's authorised redirect URI is **Supabase's callback URL** (`https://<project-ref>.supabase.co/auth/v1/callback`). Your app's URLs (`http://localhost:3000/**`, `http://localhost:5173/**`, the Vercel URL) go in **Supabase → Authentication → URL Configuration → Redirect URLs**. These are different URLs; see `SETUP.md`.
* `AuthContext` exposes `user`, `loading`, `signOut`, using `onAuthStateChange`.
* No password system. Google client secret lives only in the Supabase dashboard.

## 8. Cart

`CartContext` persisted to `localStorage` (key `shop_cart`). Item shape:

```json
{ "productId": "uuid", "name": "Canvas Tote Bag", "price": 8500, "imageUrl": "https://...", "stock": 40, "quantity": 2 }
```

The cart is for display convenience only. The server re-reads real prices and stock at checkout. Quantity is clamped to `1..stock`; show a message when the stock limit is hit. Clear the cart only after a successful order.

> Note for the owner: the assignment says "persist everything in a database". This design keeps the cart in the browser and persists products, users, orders and order items in Supabase. Confirm that's acceptable; a database-backed cart is a later step.

## 9. Checkout API contract — `POST /api/create-order`

**Request**

```text
Authorization: Bearer <Supabase access token>
Content-Type: application/json
```
```json
{
  "idempotencyKey": "uuid generated once per checkout attempt",
  "customer": { "fullName": "...", "email": "...", "phone": "...", "deliveryAddress": "..." },
  "items": [ { "productId": "uuid", "quantity": 2 } ]
}
```

The browser sends **no prices and no totals**.

**Server steps (`api/create-order.js`)**

1. Reject non-POST with 405.
2. Read the bearer token; verify with `supabaseAdmin.auth.getUser(token)`. Invalid → 401. **`user.id` from the verified token is the only source of `user_id`.** Never read it from the body. (The service-role key bypasses RLS, so this check is the security boundary.)
3. Validate the body in `server/validate.js`: non-empty name/phone/address, valid email, 1–50 items, integer quantity 1–99, `idempotencyKey` a non-empty string ≤ 64 chars. Failure → 400 with per-field messages.
4. Call `supabaseAdmin.rpc('create_order', { p_user_id, p_idempotency_key, p_customer_name, p_customer_email, p_customer_phone, p_delivery_address, p_items })`.
5. Map errors by message prefix: `INSUFFICIENT_STOCK` → 409 `{ code, message }`; `PRODUCT_NOT_FOUND` → 409; `INVALID_ITEMS` → 400; anything else → log server-side, return 500 with a generic message (no stack traces, no internals).
6. If the result has `created: true`, load the order, items and product names with the admin client and send the confirmation email inside its own `try/catch`. If `created: false` (a repeat of the same key), **do not send another email**.
7. Respond `200 { orderId, orderNumber, emailSent }`. `emailSent` is `false` if Mailgun failed; the order still succeeded.

**Client behaviour (`Checkout.jsx` + `orderService.js`)**

* Generate `idempotencyKey = crypto.randomUUID()` once when the checkout attempt starts; keep it in component state / `sessionStorage` and reuse it for retries of the same attempt. Generate a new one only after success.
* Disable the button and show "Processing Order..." while the request is in flight.
* On success: clear the cart, navigate to `/success/:orderId`.
* On failure: keep the cart, show a clear message (for 409 name the product and remaining stock), allow retry.

## 10. Email (`server/email.js`)

`POST {MAILGUN_API_BASE_URL}/v3/{MAILGUN_DOMAIN}/messages` with header `Authorization: Basic base64("api:" + MAILGUN_API_KEY)` and a form-encoded body (`from`, `to`, `subject`, `text`, `html`). Use `fetch`; no extra package.

Content: customer name, order number, items (name, quantity, unit price, line total), total, status, store name. No secrets or internal details. Escape any user-provided text placed in the HTML.

The Success page must not claim the email was delivered unless `emailSent` is true. Wording: sent → "We've sent a confirmation to {email}." not sent → "Your order is placed. We couldn't send the confirmation email, but your order is saved under Orders."

## 11. Environment variables

See `.env.example`. Browser-safe: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Server-only (never `VITE_`): `SUPABASE_SERVICE_ROLE_KEY`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM`, `MAILGUN_API_BASE_URL`. Server code reads the Supabase URL from `VITE_SUPABASE_URL`.

Local: put values in `.env.local`. Plain `npm run dev` does **not** serve `/api`, so from Phase 6 local development uses **two processes** (install the CLI once: `npm i -g vercel`, then `vercel login` and `vercel link`):

* **Terminal A — the API only:** `vercel dev --listen 3001`. Ignore the app it serves; only its function runtime is used.
* **Terminal B — the app:** `npm run dev` on port 3000.

Vite proxies `/api` → `http://localhost:3001` (`vite.config.js`), so the browser only ever talks to `http://localhost:3000`. Two processes are deliberate: `vercel dev`'s rewrite handling breaks Vite's own dev assets, and keeping one origin locally matches production. Production still uses the single `vercel.json` rewrite.

If functions can't see your variables, run `vercel env pull .env.local` after adding them in Vercel.

One Supabase project is used for both local and production; only the redirect URLs differ.

## 12. Build phases

Each phase ends with a success condition and a stop.

**Phase 0 — Human setup.** Owner completes `SETUP.md` Part A (tools) and creates accounts. Agent builds nothing yet.

**Phase 1 — Project setup + first deploy.** Create the Vite React project in this folder (don't overwrite the existing docs, `vercel.json`, `supabase/`, `.gitignore`, `.env.example`), install pre-approved deps, create the folder structure, configure routing with placeholder pages, run locally, init Git, push to GitHub, import to Vercel (`SETUP.md` Part F).
*Success:* app opens locally **and** at the Vercel URL, and refreshing a non-root route (e.g. `/cart`) works on Vercel.

**Phase 2 — Storefront (mock data).** Navbar, Home, ProductCard/Grid, Product details, availability states (In Stock / Low Stock ≤ 5 / Out of Stock), loading/error/empty states.
*Success:* customer can browse products and open details.

**Phase 3 — Cart.** CartContext, Cart page, add/remove/quantity, subtotal, localStorage, "Added to cart" feedback, navbar count.
*Success:* cart survives a refresh; totals correct; can't exceed stock.

**Phase 4 — Supabase.** Owner runs the migrations and seed (`SETUP.md` Part C) and adds env vars. Agent adds `lib/supabase.js`, `productService.js`, replaces mock data.
*Success:* products load from Supabase. Verify RLS: from the browser console, an insert into `products` using the anon client must fail.

**Phase 5 — Google auth.** Owner completes `SETUP.md` Parts D–E. Agent builds `AuthContext`, `authService`, Login page, protected `/checkout` and `/orders`, return-to-path after login, sign out.
*Success:* sign in with Google, session survives refresh, sign out works, signing in creates a row in `profiles`.

**Phase 6 — Checkout.** Checkout form + validation + order summary, `api/create-order.js`, `server/*` helpers, `orderService.createOrder`, Success page. Run with `vercel dev`.
*Success:* a valid checkout creates one `orders` row and its `order_items`, decrements stock, shows Success; ordering more than available stock is rejected with a clear message; double-clicking Place Order creates exactly one order; tampering with a price in the browser has no effect.

**Phase 7 — Mailgun.** Owner completes `SETUP.md` Part G. Agent builds `server/email.js` and wires it in.
*Success:* a successful order sends the email to an authorised address; with a deliberately wrong API key the order still succeeds and the Success page shows the "couldn't send" wording.

**Phase 8 — Orders + Account.** `/orders` list (number, date, total, status), optional order detail view, `/account`.
*Success:* user sees their own orders only (verify with a second Google account).

**Phase 9 — Polish + production check.** Responsive and keyboard pass, error/empty states, README with setup + run instructions, run the full Section 13 checklist on the Vercel URL.

## 13. Test checklist

* [ ] Products load; details open; images show (placeholder if missing); layout works at phone width
* [ ] Add/remove/increase/decrease; refresh keeps cart; stock cap works
* [ ] Google login, session persists, logout, `/checkout` and `/orders` blocked when logged out
* [ ] `profiles` row created on first login
* [ ] Order + items stored; stock decremented; `order_items.price` equals price at purchase
* [ ] Insufficient stock → no order, clear message
* [ ] Double submit → one order
* [ ] Edited prices/totals in dev tools are ignored
* [ ] Another user's orders are not readable; browser cannot call `create_order` via RPC; browser cannot write to `products`
* [ ] Email arrives with correct content; email failure does not fail the order
* [ ] No secret appears in the built JS (search the `dist` folder for part of each key)
* [ ] `.env`/`.env.local` not in Git
* [ ] All of the above on the production Vercel URL, with the production URL in Supabase redirect URLs

## 14. Out of scope for the MVP

Online payment, shipping calculation, search, categories, filters, image galleries, reviews, discount codes, admin dashboard, analytics, DB-backed cart, TypeScript, Redux, separate dev/prod Supabase projects.

## 15. Definition of done

A new visitor can: browse → open a product → add to cart → adjust quantity → go to checkout → sign in with Google → enter name, email, phone, address → place order → see the success page → receive the confirmation email → find the order in Orders. Works locally and on the Vercel production URL.

Keep it simple, modular and secure. Prefer clarity over cleverness.
