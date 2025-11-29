import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  AuthUser,
  clearAuthUser,
  getAuthUser,
  hydrateAuthUserFromSession,
  subscribeAuthUser,
} from '@/lib/authUser';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (next: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getAuthUser());
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const hydrated = await hydrateAuthUserFromSession(session);
      setUser(hydrated);
    } catch (error) {
      console.error('[AuthContext] Failed to refresh user', error);
      clearAuthUser();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    const authListener = supabase.auth.onAuthStateChange(async (_event, session) => {
      const hydrated = await hydrateAuthUserFromSession(session);
      setUser(hydrated);
      setLoading(false);
    });

    const unsubscribe = subscribeAuthUser((next) => {
      setUser(next);
    });

    return () => {
      authListener.data?.subscription.unsubscribe();
      unsubscribe?.();
    };
  }, [loadUser]);

  const value: AuthContextValue = {
    user,
    loading,
    refresh: loadUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
