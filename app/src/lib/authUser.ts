export type AuthRole = 'student' | 'vod' | 'admin';

export interface StoredAuthUser {
  // ✔ profiles.id (학생 고유 ID)
  profile_id: string;

  // ✔ 관리자도 profile_id 대신 auth_user_id를 profiles 테이블에서 매칭
  role: AuthRole;

  name: string | null;
  email: string | null;

  // ✔ Supabase access_token
  token: string;
}

export const AUTH_USER_STORAGE_KEY = 'authUser';
export const AUTH_USER_EVENT = 'auth-user-change';

const isBrowser = () =>
  typeof window !== 'undefined' && typeof localStorage !== 'undefined';

// ------------------------------
// ✔ 저장된 로그인 정보 가져오기
// ------------------------------
export const getStoredAuthUser = (): StoredAuthUser | null => {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredAuthUser;

    // 필수 필드 체크
    if (parsed && parsed.token && parsed.profile_id) {
      return parsed;
    }
  } catch (err) {
    console.warn('[authUser] Failed to parse stored auth user.', err);
  }

  return null;
};

// ------------------------------
// ✔ 저장하기 (profile_id 기준)
// ------------------------------
export const setStoredAuthUser = (user: StoredAuthUser | null) => {
  if (!isBrowser()) return;

  try {
    if (!user) {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    } else {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    }
    window.dispatchEvent(new Event(AUTH_USER_EVENT));
  } catch (err) {
    console.error('[authUser] Failed to persist auth user.', err);
  }
};

export const clearStoredAuthUser = () => setStoredAuthUser(null);

// ------------------------------
// ✔ 로그인 상태 변화를 구독
// ------------------------------
export const subscribeAuthUser = (
  listener: (user: StoredAuthUser | null) => void
) => {
  if (!isBrowser()) return () => {};

  const handler = () => listener(getStoredAuthUser());

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
export const isRole = (user: StoredAuthUser | null, role: AuthRole) =>
  user?.role === role;