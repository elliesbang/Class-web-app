import React, { createContext, useContext } from 'react';

import type { AuthUserState } from '@/hooks/useAuthUser';
import { useAuthUserState } from '@/hooks/useAuthUser';

const AuthContext = createContext<AuthUserState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuthUserState();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return ctx;
};

export const useAuthUser = () => useAuth();
