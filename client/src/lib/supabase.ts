import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in the environment',
  );
}

// Defaults are deliberate: persistSession, autoRefreshToken and
// detectSessionInUrl are all on, so the OAuth callback needs no manual
// fragment parsing and the access token refreshes itself in the background.
export const supabase = createClient(url, anonKey);
