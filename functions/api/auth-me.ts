import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
  try {
    // 1) Supabase 클라이언트 생성
    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_ANON_KEY,
      {
        global: {
          fetch: (...args) => fetch(...args),
        },
      }
    );

    // 2) Authorization 헤더는 소문자로 들어온다
    const authHeader = context.request.headers.get('authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '').replace('bearer ', '');

    if (!token) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3) Edge 환경 호환 getUser
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4) user 역할(role)이 supabase user.metadata에 있다고 가정
    // FE가 바로 쓸 수 있는 구조
    return new Response(JSON.stringify({ user }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[auth-me] error', err);
    return new Response(JSON.stringify({ user: null }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}