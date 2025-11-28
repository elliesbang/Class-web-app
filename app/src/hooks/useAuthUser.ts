import { useEffect, useState } from 'react';
import { getAuthUser, subscribeAuthUser, type AuthUser } from '../lib/authUser';

export const useAuthUser = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getAuthUser());

  useEffect(() => {
    const unsubscribe = subscribeAuthUser(setAuthUser);
    return () => unsubscribe();
  }, []);

  return authUser;
};