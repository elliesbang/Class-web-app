import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAuthUser() {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        setAuthUser(null);
        setLoading(false);
        return;
      }

      setAuthUser({
        id: data.session.user.id,
        email: data.session.user.email,
        role: data.session.user.user_metadata.role ?? null,
      });

      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setAuthUser(null);
        } else {
          setAuthUser({
            id: session.user.id,
            email: session.user.email,
            role: session.user.user_metadata.role ?? null,
          });
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return { authUser, loading };
}
