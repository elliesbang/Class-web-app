import { useEffect, useState } from 'react';
import { clearAuthUser, getAuthUser, setAuthUser, subscribeAuthUser, type AuthUser } from '../lib/authUser';
import { supabase } from '../lib/supabaseClient';

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(() => getAuthUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadAuthUser = async () => {
      if (isMounted) {
        setLoading(true);
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token ?? '';

        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          if (!isMounted) return;
          clearAuthUser();
          setUser(null);
          setLoading(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, name, role')
          .eq('id', userData.user.id)
          .single();

        if (profileError || !profile) {
          console.error('[useAuthUser] Failed to load profile', profileError);
          if (!isMounted) return;
          clearAuthUser();
          setUser(null);
          setLoading(false);
          return;
        }

        const nextUser: AuthUser = {
          id: profile.id ?? userData.user.id,
          email: profile.email ?? userData.user.email ?? '',
          name: profile.name ?? '',
          role: profile.role,
          accessToken,
        };

        if (!isMounted) return;

        setAuthUser(nextUser);
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

    loadAuthUser();

    const authListener = supabase.auth.onAuthStateChange(async () => {
      await loadAuthUser();
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
