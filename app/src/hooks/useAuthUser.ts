import { useEffect, useState } from 'react';
import { getStoredAuthUser, subscribeAuthUser, type StoredAuthUser } from '../lib/authUser';

export const useAuthUser = () => {
  const [authUser, setAuthUser] = useState<StoredAuthUser | null>(() => getStoredAuthUser());

  useEffect(() => {
    const unsubscribe = subscribeAuthUser(setAuthUser);
    return () => {
      unsubscribe();
    };
  }, []);

  return authUser;
};
