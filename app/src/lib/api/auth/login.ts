import { supabase } from '@/lib/supabaseClient';

export type LoginResponse = {
  user: any;
  session: {
    access_token: string;
    refresh_token: string;
  } | null;
  profile: any;
  error?: string;
};

export async function login(email: string, password: string) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const result: LoginResponse = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || '로그인에 실패했습니다.');
  }

  if (result.session?.access_token && result.session?.refresh_token) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });

    if (sessionError) {
      throw new Error(sessionError.message);
    }
  }

  return {
    user: result.user,
    profile: result.profile,
    token: result.session?.access_token,
  };
}
