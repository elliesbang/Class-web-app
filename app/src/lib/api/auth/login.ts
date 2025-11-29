import { supabase } from '@/lib/supabaseClient';

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);

  // Cloudflare 환경에서 세션 즉시 동기화
  await supabase.auth.refreshSession();

  const user = data.user;
  const token = data.session?.access_token;

  if (!user || !token) {
    throw new Error('로그인에 실패했습니다.');
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData) {
    throw new Error('해당 계정의 프로필 정보를 불러올 수 없습니다.');
  }

  return {
    user,
    profile: profileData,
    token,
  };
}
