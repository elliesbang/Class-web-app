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

// ------------------------------
// ✔ 저장된 로그인 정보 가져오기
// ------------------------------
export const getAuthUser = (): AuthUser | null => {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AuthUser | null;

    if (parsed && parsed.token && parsed.user_id && parsed.role) {
      return parsed;
    }
  } catch (err) {
    console.warn('[authUser] Failed to parse stored auth user.', err);
  }

  clearAuthUser();
  return null;
};

// ------------------------------
// ✔ 저장하기 (user_id 기준)
// ------------------------------
export const setAuthUser = (user: AuthUser | null) => {
  if (!isBrowser()) return;

  try {
    if (!user) {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    } else {
      const payload: AuthUser = {
        ...user,
        role: user.role,
      };
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(payload));
    }
    window.dispatchEvent(new Event(AUTH_USER_EVENT));
  } catch (err) {
    console.error('[authUser] Failed to persist auth user.', err);
  }
};

export const clearAuthUser = () => setAuthUser(null);

// ------------------------------
// ✔ 로그인 상태 변화를 구독
// ------------------------------
export const subscribeAuthUser = (
  listener: (user: AuthUser | null) => void,
) => {
  if (!isBrowser()) return () => {};

  const handler = () => listener(getAuthUser());

  window.addEventListener('storage', handler);
  window.addEventListener(AUTH_USER_EVENT, handler);

  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(AUTH_USER_EVENT, handler);
  };
};

// ------------------------------
// ✔ 역할 체크
// ------------------------------
export const isRole = (user: AuthUser | null, role: AuthRole) =>
  user?.role === role;
