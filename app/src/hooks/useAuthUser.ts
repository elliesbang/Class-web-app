import { supabase } from './supabaseClient';

// ------------------------------
// ✔ 타입 정의
// ------------------------------
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
// ✔ localStorage에서 로그인 정보 가져오기
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
// ✔ localStorage에 저장하기
// ------------------------------
export const setAuthUser = (user: AuthUser | null) => {
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

export const clearAuthUser = () => setAuthUser(null);

// ------------------------------
// ✔ authUser 변경 구독
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

// =======================================================
// 🔥 Supabase 세션을 localStorage에 동기화
// =======================================================
supabase.auth.onAuthStateChange(async (_event, session) => {
  if (!session?.user) {
    clearAuthUser();
    return;
  }

  // profile(role, name) 가져오기
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    clearAuthUser();
    return;
  }

  const newUser: AuthUser = {
    user_id: session.user.id,
    email: session.user.email ?? '',
    name: profile.name ?? '',
    role: profile.role,
    token: session.access_token,
  };

  setAuthUser(newUser);
});