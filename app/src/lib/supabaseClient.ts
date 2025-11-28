import { createClient } from "@supabase/supabase-js";

// Cloudflare Pages (HTML template inject)
const injected = (window as any).__env || {};

const url =
  injected.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL;

const anon =
  injected.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anon);
