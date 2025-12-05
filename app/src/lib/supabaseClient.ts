import { createClient } from '@supabase/supabase-js';

// 1. 안전한 스토리지 어댑터 생성
// localStorage 접근이 차단되어도 앱이 멈추지 않고 메모리(변수)에만 저장하게 하여 오류를 방지합니다.
const safeLocalStorage = {
  getItem: (key: string) => {
    try {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      // 스토리지 접근 차단 시 에러 무시하고 null 반환
      console.warn('LocalStorage access denied, falling back to memory.');
      return null;
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      // 저장 실패 시 에러 무시 (로그인 상태가 새로고침하면 풀리겠지만, 앱이 죽진 않음)
    }
  },
  removeItem: (key: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      // 삭제 실패 시 무시
    }
  },
};

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      // 2. 위에서 만든 안전한 스토리지 적용
      storage: safeLocalStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
