import { useEffect, useState } from 'react';
import { getAuthUser, subscribeAuthUser, type AuthUser } from '../lib/authUser';

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(() => getAuthUser());

  useEffect(() => {
    setUser(getAuthUser());
    const unsubscribe = subscribeAuthUser(setUser);
    return () => unsubscribe?.();
  }, []);

  return user;
}
