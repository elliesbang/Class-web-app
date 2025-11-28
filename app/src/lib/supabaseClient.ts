import { createClient } from "@supabase/supabase-js";

const url =
  window.__env?.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;

const anon =
  window.__env?.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anon);
