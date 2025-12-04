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
  const [user, setUserState] = useState<AuthUser | null>(() => getAuthUser());
  const [loading, setLoading] = useState(true);

  const setUser = (u: AuthUser | null) => {
    setUserState(u);
    setAuthUser(u);
  };

  // 🔥 서버 auth-me 기반 로그인 유지
  const loadUser = useCallback(async () => {
    setLoading(true);

    try {
      // 1) Supabase 세션 먼저 확인
      const { data: { session } } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        clearAuthUser();
        setUser(null);
        setLoading(false);
        return;
      }

      // 2) 서버(auth-me)로 유효성 체크
      const res = await apiFetch<{ user: AuthUser | null }>('/api/auth-me');

      if (!res?.user) {
        clearAuthUser();
        setUser(null);
        setLoading(false);
        return;
      }

      // 3) FE AuthUser로 저장
      setUser(res.user);

    } catch (err) {
      console.error('[AuthContext] loadUser error:', err);
      clearAuthUser();
      setUser(null);

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.access_token) {
        clearAuthUser();
        setUser(null);
        return;
      }

      await loadUser();
    });

    return () => subscription.subscription.unsubscribe();
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