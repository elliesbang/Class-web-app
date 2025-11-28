import { createClient } from "@supabase/supabase-js";

// Cloudflare Pages v3에서는 HTML 템플릿으로 변수가 들어옴
const injectedUrl = (window as any).__env?.VITE_SUPABASE_URL;
const injectedAnon = (window as any).__env?.VITE_SUPABASE_ANON_KEY;

// Vite 개발 모드 / 일반 Pages v2 빌드
const viteUrl = import.meta.env.VITE_SUPABASE_URL;
const viteAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = injectedUrl || viteUrl;
const supabaseAnonKey = injectedAnon || viteAnon;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
