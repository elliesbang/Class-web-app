export type AuthRole = 'student' | 'vod' | 'admin';

export interface StoredAuthUser {
  user_id: string;
  role: AuthRole;
  name: string;
  email: string;
  token: string;
}

export const AUTH_USER_STORAGE_KEY = 'authUser';
export const AUTH_USER_EVENT = 'auth-user-change';

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export const getStoredAuthUser = (): StoredAuthUser | null => {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredAuthUser;
    if (parsed && typeof parsed === 'object' && parsed.token) {
      return parsed;
    }
  } catch (error) {
    console.warn('[authUser] Failed to parse stored auth user.', error);
  }

  return null;
};

export const setStoredAuthUser = (user: StoredAuthUser | null) => {
  if (!isBrowser()) {
    return;
  }

  try {
    if (!user) {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    } else {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    }
    window.dispatchEvent(new Event(AUTH_USER_EVENT));
  } catch (error) {
    console.error('[authUser] Failed to persist auth user.', error);
  }
};

export const clearStoredAuthUser = () => setStoredAuthUser(null);

export const subscribeAuthUser = (listener: (user: StoredAuthUser | null) => void) => {
  if (!isBrowser()) {
    return () => {};
  }

  const handleChange = () => {
    listener(getStoredAuthUser());
  };

  window.addEventListener('storage', handleChange);
  window.addEventListener(AUTH_USER_EVENT, handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(AUTH_USER_EVENT, handleChange);
  };
};

export const isRole = (user: StoredAuthUser | null, role: AuthRole) => user?.role === role;
