import { useCallback, useEffect, useState } from 'react';

import type { AuthRole, AuthUser } from '@/lib/authUser';
import { clearAuthUser, setAuthUser } from '@/lib/authUser';

const getStoredToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('token') : null;

const getStoredRole = (): AuthRole | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('role');
  return (stored as AuthRole | null) ?? null;
};

export type AuthUserState = {
  user: AuthUser | null;
  role: AuthRole | null;
  loggedIn: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (next: AuthUser | null) => void;
};

export function useAuthUserState(): AuthUserState {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback((next: AuthUser | null) => {
    setUserState(next);
    setRole(next?.role ?? null);
    setLoggedIn(!!next);

    if (typeof window === 'undefined') return;

    if (!next) {
      clearAuthUser();
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      return;
    }

    setAuthUser(next);
    if (next.accessToken) {
      localStorage.setItem('token', next.accessToken);
    }
    if (next.role) {
      localStorage.setItem('role', next.role);
    }
  }, []);

  const refresh = useCallback(async () => {
    const token = getStoredToken();
    const storedRole = getStoredRole();

    if (!token) {
      syncUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data?.user) {
        const resolvedRole = (data.user.role as AuthRole | null) ?? storedRole ?? null;

        const nextUser: AuthUser = {
          ...data.user,
          accessToken: token,
          role: resolvedRole ?? (data.user.role as AuthRole | null),
        };

        if (resolvedRole) {
          localStorage.setItem('role', resolvedRole);
        }

        syncUser(nextUser);
      } else {
        syncUser(null);
      }
    } catch (error) {
      console.error('[useAuthUser] Failed to hydrate user', error);
      syncUser(null);
    } finally {
      setLoading(false);
    }
  }, [syncUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    user,
    role,
    loggedIn,
    loading,
    refresh,
    setUser: syncUser,
  };
}
