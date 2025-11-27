import { supabase } from '@/lib/supabaseClient';
import { setStoredAuthUser } from '@/lib/authUser';

export async function login(email: string, password: string) {
  // 1) Supabase auth 로그인
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);

  const user = data.user;
  const token = data.session?.access_token;

  if (!user || !token) {
    throw new Error('로그인에 실패했습니다.');
  }

  // 2) profiles 테이블에서 profile 정보 가져오기
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .eq('auth_user_id', user.id)   // auth.users.uid와 연결된 컬럼
    .single();

  if (profileError || !profileData) {
    throw new Error('해당 계정의 프로필 정보를 불러올 수 없습니다.');
  }

  // 3) localStorage에 저장 (AssignmentTab, 과제 API가 기대하는 구조)
  setStoredAuthUser({
    profile_id: profileData.id,
    role: profileData.role,
    name: profileData.name,
    email: profileData.email,
    token,
  });

  return {
    profile_id: profileData.id,
    role: profileData.role,
    name: profileData.name,
    email: profileData.email,
    token,
  };
}