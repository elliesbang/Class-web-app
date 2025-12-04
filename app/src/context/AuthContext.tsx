import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  AuthUser,
  clearAuthUser,
  setAuthUser,
  getAuthUser,
} from '@/lib/authUser';
import { supabase } from '@/lib/supabaseClient';
import { apiFetch } from '@/lib/apiClient';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (next: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ❗ Cloudflare Pages 빌드 환경에서는 window/localStorage 없음
  // → 초기 user는 항상 null로 두고, hydration에서 복원해야 함
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 안전한 setter
  const setUser = (u: AuthUser | null) => {
    setUserState(u);
    setAuthUser(u);
  };

  // 🔥 auth-me 서버 기반으로 User 인증 유지
  const loadUser = useCallback(async () => {
    setLoading(true);

    try {
      // 1) Supabase 세션 확인
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        clearAuthUser();
        setUser(null);
        setLoading(false);
        return;
      }

      // 2) 서버 인증 (/api/auth-me)
      const res = await apiFetch<{ user: AuthUser | null }>('/api/auth-me');

      if (!res?.user) {
        clearAuthUser();
        setUser(null);
        setLoading(false);
        return;
      }

      // 3) FE AuthUser 구조 저장
      setUser(res.user);

    } catch (err) {
      console.error('[AuthContext] loadUser error:', err);
      clearAuthUser();
      setUser(null);

    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 hydration
  useEffect(() => {
    // 브라우저 환경에서만 localStorage 접근 가능
    if (typeof window !== 'undefined') {
      const saved = getAuthUser();
      if (saved) {
        setUserState(saved);
      }
    }

    loadUser();

    // Supabase auth 이벤트 구독
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
    <AuthContext.Provider value={{ user, loading, refresh: loadUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};