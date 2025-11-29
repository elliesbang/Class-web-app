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
    // 🔥 Cloudflare Pages에서는 반드시 storage를 명시해야 함
    storage: window.localStorage,

    // 🔥 세션 유지 필수
    persistSession: true,

    // 🔥 OAuth/URL 기반 세션 유지
    detectSessionInUrl: true,

    // 🔥 토큰 자동 갱신
    autoRefreshToken: true,
  },
});
