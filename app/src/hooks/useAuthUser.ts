import { supabase } from './supabaseClient';

let currentUser = null;
let listeners: ((user: any) => void)[] = [];

// 현재 사용자 가져오기
export const getAuthUser = () => currentUser;

// authState마다 listeners 호출
const notify = () => {
  for (const cb of listeners) cb(currentUser);
};

// 로그인/로그아웃 시 state 업데이트
supabase.auth.onAuthStateChange(async (_event, session) => {
  if (!session?.user) {
    currentUser = null;
    notify();
    return;
  }

  // profiles 정보도 포함 (role 때문에 필요)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  currentUser = {
    ...session.user,
    profile,
  };

  notify();
});

// 구독 관리
export const subscribeAuthUser = (callback: (user: any) => void) => {
  listeners.push(callback);

  // 첫 로딩 시 즉시 사용자 전달
  callback(currentUser);

  return () => {
    listeners = listeners.filter((cb) => cb !== callback);
  };
};