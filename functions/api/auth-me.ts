import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
  try {
    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_ANON_KEY,
      { global: { fetch: (...args) => fetch(...args) } }
    );

    // Cloudflare에서는 headers는 소문자로 들어옴
    const authHeader = context.request.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace(/Bearer\s+/i, '');
    if (!token) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Supabase Auth에서 user 가져오기
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 🔥 profiles 테이블에서 role, name 가져오기
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 🔥 FE가 요구하는 AuthUser 구조로 변환
    const authUser = {
      id: profile.id,
      email: profile.email ?? user.email ?? '',
      name: profile.name ?? '',
      role: profile.role,
      accessToken: token,
    };

    return new Response(JSON.stringify({ user: authUser }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('auth-me error:', err);
    return new Response(JSON.stringify({ user: null }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}