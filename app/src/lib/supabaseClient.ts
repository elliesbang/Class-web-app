import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,       // 🔥 세션(localStorage) 자동 저장
      autoRefreshToken: true,     // 🔥 access token 자동 갱신
      detectSessionInUrl: true,   // 🔥 OAuth/Email 링크 지원
    },
  }
);
