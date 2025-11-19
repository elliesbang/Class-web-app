import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

if (!SUPABASE_URL) {
  console.warn('[supabase] Missing SUPABASE_URL environment variable.');
}

if (!SUPABASE_SERVICE_KEY) {
  console.warn('[supabase] Missing SUPABASE_SERVICE_KEY environment variable.');
}

export const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_SERVICE_KEY ?? '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
