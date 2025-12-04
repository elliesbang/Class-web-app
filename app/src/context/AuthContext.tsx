import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  AuthUser,
  clearAuthUser,
  setAuthUser,
  getAuthUser,
} from '@/lib/authUser';

import { supabase } from '@/lib/supabaseClient';

// 🔥 반드시 경로 수정! (api 폴더 안에 있기 때문)
import { apiFetch } from '@/lib/api/apiClient';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (next: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  /**
   * ⚠ Cloudflare Pages 빌드 환경에서는 window/localStorage가 없음
   * → SSR 초기 hydration 시 에러 방지 위해 기본값은 null 사용
   */
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  /** 안전한 user setter */
  const setUser = (u: AuthUser | null) => {
    setUserState(u);
    setAuthUser(u);
  };

  /**
   * 🔥 핵심: 서버에서 /api/auth-me 를 호출하여
   * 토큰이 유효한지 지속적으로 확인해 로그인 유지
   */
  const loadUser = useCallback(async () => {
    setLoading(true);

    try {
      // 1) Supabase 세션에서 access_token 확인
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        clearAuthUser();
        setUser(null);
        return;
      }

      // 2) 서버 함수로 토큰 검증
      const res = await apiFetch<{ user: AuthUser | null }>('/auth-me');

      if (!res?.user) {
        clearAuthUser();
        setUser(null);
        return;
      }

      // 3) FE AuthUser 저장
      setUser(res.user);
    } catch (err) {
      console.error('[AuthContext] loadUser error:', err);
      clearAuthUser();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 🔥 초기 마운트 시:
   * - localStorage 사용자 복원 (브라우저 환경 한정)
   * - 서버 auth-me 이용해 재검증
   * - Supabase auth 이벤트 구독
   */
  useEffect(() => {
    // localStorage 접근은 반드시 브라우저 환경에서만
    if (typeof window !== 'undefined') {
      const saved = getAuthUser();
      if (saved) {
        setUserState(saved);
      }
    }

    loadUser();

    // Supabase auth 이벤트 구독 → 로그인/로그아웃 감지
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.access_token) {
          clearAuthUser();
          setUser(null);
          return;
        }
        await loadUser();
      }
    );

    return () => {
      subscription?.subscription?.unsubscribe?.();
    };
  }, [loadUser]);

  return (
    <AuthContext.Provider
      value={{ user, loading, refresh: loadUser, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};