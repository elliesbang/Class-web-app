import { createClient } from '@supabase/supabase-js';

export const onRequestPost = async ({ request, env }) => {
  if (request.method.toUpperCase() !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const email = String(body?.email ?? '').trim();
    const password = String(body?.password ?? '');

    if (!email || !password) {
      return new Response(JSON.stringify({ message: '이메일과 비밀번호를 입력해주세요.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      global: { fetch: (...args) => fetch(...args) },
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      const message = error?.message ?? '로그인에 실패했습니다.';
      return new Response(JSON.stringify({ message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { session, user } = data;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, name, email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.warn('[login] profile lookup failed', profileError.message);
    }

    const userRole = profile?.role ?? (user.app_metadata as any)?.role ?? null;

    return new Response(
      JSON.stringify({
        access_token: session.access_token,
        user_role: userRole,
        user: {
          id: user.id,
          email: user.email,
          role: userRole,
          name: profile?.name ?? user.user_metadata?.full_name ?? '',
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err: any) {
    const message = err?.message ?? '로그인 처리 중 오류가 발생했습니다.';
    return new Response(JSON.stringify({ message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
