import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
  try {
    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_ANON_KEY
    );

    // ⚠️ FE에서 보낸 Authorization 헤더 읽기
    const token = context.request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 🔥 Supabase에서 현재 user 정보 확인
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 필요하면 role도 DB에서 가져올 수 있음
    // const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    return new Response(JSON.stringify({ user }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ user: null }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}