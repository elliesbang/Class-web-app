import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAuthUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error || !data?.user) {
        setUser(null);
      } else {
        setUser(data.user);
      }
    };

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return user;
}
