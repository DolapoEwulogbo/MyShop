// src/config/brand.js
// Single source of truth for the W's brand identity.
//
// Every user-facing brand string should be imported from here rather than typed
// inline, so a future rebrand is one file to edit instead of a hunt across the
// tree. This is the "establish brand identity" phase only: no marketplace or
// multi-vendor concepts are introduced here.
//
// ---------------------------------------------------------------------------
// TWO THINGS A BRAND CONFIG CANNOT COVER — read before the next rebrand:
//   1. index.html <title> is static HTML and CANNOT import from this module. It
//      must be kept in step by hand.
//   2. server/email.js (Phase 7) is server-only and must NOT import from src/
//      (see AGENTS.md Sec 6 — src/ helpers are the browser boundary). When the
//      confirmation email is built it will need its own copy of these values, or
//      a module shared outside src/. Decide that structure in Phase 7.
// ---------------------------------------------------------------------------
//
// The domain below is a brand CONCEPT only. wearsandmore.com is deliberately NOT
// configured as a production domain or an OAuth redirect; the live deployment
// remains the existing Vercel URL until that is a separate, explicit decision.
export const BRAND = {
  name: "W's",
  descriptor: 'Wears & More',
  // Intentionally empty: no tagline/positioning has been decided yet. Do not
  // invent one here. The footer falls back to "name — descriptor" while blank.
  tagline: '',
  domain: 'wearsandmore.com'
}

// "W's — Wears & More" — the full display form, used by the footer and <title>.
// Falls back to this whenever `tagline` is empty, so adding a tagline later
// needs no further call-site changes.
export function brandDisplayName() {
  return BRAND.tagline ? `${BRAND.name} — ${BRAND.tagline}` : `${BRAND.name} — ${BRAND.descriptor}`
}