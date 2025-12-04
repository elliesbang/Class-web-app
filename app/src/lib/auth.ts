import { hydrateAuthUserFromSession, setAuthUser } from './authUser';
import { supabase } from './supabaseClient';

const resolveRedirect = (role: string | null | undefined) => {
  if (role === 'admin') {
    return '/admin/dashboard';
  }
  return '/home';
};

export const registerUser = async (
  name: string,
  email: string,
  pw: string,
  pw2: string,
  role: 'student' | 'vod',
) => {
  if (!name || !email || !pw || !pw2) {
    alert('모든 필드를 입력해주세요.');
    return;
  }

  if (pw !== pw2) {
    alert('비밀번호가 일치하지 않습니다.');
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pw,
    });

    if (error) {
      throw error;
    }

    const user = data.user;
    const session = data.session;

    if (!user) {
      throw new Error('회원가입 후 사용자 정보를 불러오지 못했습니다.');
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      name: name.trim(),
      email: email.trim(),
      role,
    });

    if (profileError) {
      throw profileError;
    }

    if (session) {
      await hydrateAuthUserFromSession(session);
    }

    window.location.href = '/home';
  } catch (caught) {
    console.error('[auth] registerUser failed', caught);
    alert('회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.');
  }
};

export const loginWithGoogle = async (userType: 'admin' | 'student' | 'vod') => {
  try {
    localStorage.setItem('oauth_role', userType);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/google/callback`,
      },
    });
  } catch (error) {
    console.error('[auth] loginWithGoogle failed', error);
    alert('Google 로그인 중 오류가 발생했습니다.');
  }
};

export const loginWithEmail = async (email: string, pw: string, userType: 'admin' | 'student' | 'vod') => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pw,
    });

    if (error) {
      throw error;
    }

    const user = data.user;
    const session = data.session;

    if (!user) {
      throw new Error('로그인 후 사용자 정보를 불러오지 못했습니다.');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    if (!profile || profile.role !== userType) {
      await supabase.auth.signOut();
      alert('선택한 로그인 유형과 계정 역할이 일치하지 않습니다.');
      return;
    }

    if (session) {
      await hydrateAuthUserFromSession(session);
    } else {
      setAuthUser({
        id: profile.id ?? user.id,
        email: profile.email ?? email,
        name: profile.name ?? '',
        role: profile.role,
        accessToken: '',
      });
    }

    window.location.href = resolveRedirect(profile.role);
  } catch (caught) {
    console.error('[auth] loginWithEmail failed', caught);
    alert('로그인에 실패했습니다. 다시 시도해주세요.');
  }
};

export const logout = async () => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('[auth] logout failed', error);
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
    }
    setAuthUser(null);
    window.location.href = '/home';
  }
};

export const completeOAuthLogin = async () => {
  const savedRole = localStorage.getItem('oauth_role') as 'admin' | 'student' | 'vod' | null;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      throw new Error('로그인 세션을 불러오지 못했습니다.');
    }

    const user = session.user;
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    const resolvedRole = profile?.role ?? savedRole ?? 'student';

    if (profile && savedRole && profile.role !== savedRole) {
      await supabase.auth.signOut();
      localStorage.removeItem('oauth_role');
      alert('선택한 로그인 유형과 계정 역할이 일치하지 않습니다.');
      return;
    }

    if (!profile) {
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name ?? '',
        role: resolvedRole,
      });

      if (upsertError) {
        throw upsertError;
      }
    }

    await hydrateAuthUserFromSession(session);

    localStorage.removeItem('oauth_role');
    window.location.href = resolveRedirect(resolvedRole);
  } catch (caught) {
    console.error('[auth] completeOAuthLogin failed', caught);
    alert('로그인 처리 중 오류가 발생했습니다.');
  }
};
