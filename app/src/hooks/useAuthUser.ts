import { useEffect, useState } from 'react';
import {
  clearAuthUser,
  getAuthUser,
  hydrateAuthUserFromSession,
  subscribeAuthUser,
  type AuthUser,
} from '../lib/authUser';
import { supabase } from '../lib/supabaseClient';

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(() => getAuthUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const resolveSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const nextUser = await hydrateAuthUserFromSession(session);
        if (!isMounted) return;
        setUser(nextUser);
        setLoading(false);
      } catch (error) {
        console.error('[useAuthUser] Failed to resolve session', error);
        if (!isMounted) return;
        clearAuthUser();
        setUser(null);
        setLoading(false);
      }
    };

    resolveSession();

    const authListener = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = await hydrateAuthUserFromSession(session);
      if (!isMounted) return;
      setUser(nextUser);
      setLoading(false);
    });

    const unsubscribe = subscribeAuthUser((next) => {
      if (!isMounted) return;
      setUser(next);
    });

    return () => {
      isMounted = false;
      authListener.data?.subscription.unsubscribe();
      unsubscribe?.();
    };
  }, []);

  return { user, loading };
}
