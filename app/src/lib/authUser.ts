import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export type AuthRole = 'student' | 'vod' | 'admin';

export type AuthUser = {
  user_id: string;
  email: string;
  name?: string;
  role: AuthRole;
  token: string;
};

export const AUTH_USER_STORAGE_KEY = 'authUser';
export const AUTH_USER_EVENT = 'auth-user-change';

const isBrowser = () =>
  typeof window !== 'undefined' && typeof localStorage !== 'undefined';

// -----------------------------------------------------
// ✔ localStorage에서 불러오기
// -----------------------------------------------------
export const getAuthUser = (): AuthUser | null => {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed?.token && parsed?.user_id && parsed?.role) {
      return parsed;
    }
  } catch (e) {
    console.warn('[authUser] Failed to parse auth user:', e);
  }

  clearAuthUser();
  return null;
};

// -----------------------------------------------------
// ✔ localStorage 저장
// -----------------------------------------------------
export const setAuthUser = (user: AuthUser | null) => {
  if (!isBrowser()) return;

  try {
    if (!user) {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    } else {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    }
    window.dispatchEvent(new Event(AUTH_USER_EVENT));
  } catch (e) {
    console.error('[authUser] Failed to set auth user:', e);
  }
};

export const clearAuthUser = () => setAuthUser(null);

// -----------------------------------------------------
// ✔ authUser 변경 구독
// -----------------------------------------------------
export const subscribeAuthUser = (listener: (u: AuthUser | null) => void) => {
  if (!isBrowser()) return () => {};

  const handler = () => listener(getAuthUser());
  window.addEventListener(AUTH_USER_EVENT, handler);

  return () => window.removeEventListener(AUTH_USER_EVENT, handler);
};

export const hydrateAuthUserFromSession = async (
  session: Session | null,
): Promise<AuthUser | null> => {
  if (!session?.user) {
    clearAuthUser();
    return null;
  }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', session.user.id)
      .single();

    if (error || !profile) {
      console.error('[authUser] Failed to load profile', error);
      clearAuthUser();
      return null;
    }

    const newUser: AuthUser = {
      user_id: session.user.id,
      email: session.user.email ?? '',
      name: profile.name ?? '',
      role: profile.role,
      token: session.access_token,
    };

    setAuthUser(newUser);
    return newUser;
  } catch (error) {
    console.error('[authUser] Unexpected error while hydrating user', error);
    clearAuthUser();
    return null;
  }
};
