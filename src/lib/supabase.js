import { createClient } from '@supabase/supabase-js'

// Phase 4: browser Supabase client (anon key only — safe to expose).
// Values come from .env.local locally and Vercel env vars in production.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to .env.local (see .env.example).')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
