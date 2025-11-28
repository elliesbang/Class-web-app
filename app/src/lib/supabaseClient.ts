import { createClient } from "@supabase/supabase-js";

const injected = (window as any).__env || {};

const url =
  injected.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL;

const anon =
  injected.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,       // 🔥 로그인 유지 필수
    detectSessionInUrl: true,   // 🔥 OAuth/토큰 유지 필수
    autoRefreshToken: true,     // 🔥 토큰 자동 갱신
  },
});
