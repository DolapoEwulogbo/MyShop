// server/supabaseAdmin.js
// Server-only Supabase client built with the SERVICE ROLE key, which BYPASSES
// Row Level Security. Because of that this module must NEVER be imported from
// anything under src/ (the browser) — only from api/ and server/ helpers.
//
// Per AGENTS.md Sec 11 the server reads the Supabase URL from VITE_SUPABASE_URL
// (it is the same project URL the browser uses; only the key differs).
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Exposed so api/create-order.js can fail fast with a generic 500 instead of
// leaking a client-construction error (or, worse, silently using placeholder
// values). It reports only a boolean — never the keys themselves.
export const isSupabaseAdminConfigured = Boolean(supabaseUrl && serviceRoleKey)

// Placeholder fallbacks keep client construction from throwing at import time;
// isSupabaseAdminConfigured is the gate that stops us ever using them.
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  serviceRoleKey || 'placeholder-service-role-key',
  {
    auth: {
      // Server-side the client is stateless: no session to persist or refresh.
      autoRefreshToken: false,
      persistSession: false
    }
  }
)