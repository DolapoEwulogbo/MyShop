# AGENTS.md — My Shop mobile app (Expo)

This is the companion mobile app for the My Shop e-commerce website (parent folder). It deliberately reuses the website's backend: the SAME Supabase project, the SAME `cart_items` table (realtime-synced) and the SAME `POST /api/create-order` Vercel endpoint. The website's AGENTS.md rules apply here too (layering, no secrets, ask before new dependencies).

## Stack

- Expo SDK 57 (React Native 0.86, React 19), plain JavaScript (no TypeScript)
- Navigation: `@react-navigation/native-stack` (NOT Expo Router — the scaffold's default AGENTS.md text does not apply)
- Supabase: `@supabase/supabase-js` with AsyncStorage session persistence
- Google OAuth via `expo-web-browser` auth session + `expo-linking`, tested in Expo Go

## Layering

`screens → contexts → services → Supabase / API`. No database queries inside screens. `mobile/src/services/cartService.js` and `productService.js` are copied from the web app — keep them in sync if the web versions change.

## Env

`mobile/.env` (gitignored) holds `EXPO_PUBLIC_*` values only — they are bundled into the app, so they must be public-safe: Supabase URL, anon key, `EXPO_PUBLIC_API_BASE_URL` (the Vercel production URL). NEVER put the service-role key or Resend key in a mobile env file.

## Commands

- `npx expo install <package>` — ALWAYS, not `npm add` (resolves SDK-compatible versions)
- `npx expo start` — dev server; phone scans the QR code in Expo Go (same Wi-Fi)
- `npx expo export --platform android` — bundle-only sanity check (catches import/syntax errors)
- `npx expo-doctor` — diagnose dependency/config problems

## Rules

- Google sign-in redirect: in Expo Go the callback is `https://expo.dev/expo-go/auth/callback` (a universal link Expo Go is entitled to — iOS 26 Safari/auth-session refuse `exp://` scheme redirects). In a real build it is `myshop://auth/callback` (app.json scheme). Either way the URL must be allow-listed in Supabase → Authentication → URL Configuration → Redirect URLs (see SETUP.md Part I). The switch is automatic via `Constants.appOwnership`.
- Cart sync is instant because CartContext subscribes to `postgres_changes` on `cart_items` for the signed-in user — do not replace that with polling.
- Orders go through `orderService.createOrder` only (Bearer token, idempotency key). The phone sends no prices/totals.
- Never hand-edit `ios/` or `android/` folders (they are generated).
