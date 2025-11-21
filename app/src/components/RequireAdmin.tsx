import { supabase } from '@/lib/supabaseClient';
import { getUserRole } from '@/lib/api/auth/getUserRole';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function RequireAdmin({ children }) {
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setAllowed(false);

      const role = await getUserRole(user.id);
      setAllowed(role === 'admin');
    }
    check();
  }, []);

  if (allowed === null) return null;
  if (allowed === false) return <Navigate to="/" />;
  return children;
}
