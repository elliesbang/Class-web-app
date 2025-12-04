import { createClient } from '@supabase/supabase-js';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const onRequestGet = async ({ request, env }) => {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const token = authHeader?.replace(/Bearer\s+/i, '').trim();

  if (!token) {
    return jsonResponse({ user: null });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    global: { fetch: (...args) => fetch(...args) },
  });

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData?.user) {
      return jsonResponse({ user: null });
    }

    const { user } = authData;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('id', user.id)
      .single();

    const responseUser = {
      id: profile?.id ?? user.id,
      email: profile?.email ?? user.email ?? '',
      name: profile?.name ?? user.user_metadata?.full_name ?? '',
      role: profile?.role ?? (user.app_metadata as any)?.role ?? null,
      accessToken: token,
    };

    return jsonResponse({ user: responseUser });
  } catch (err: any) {
    return jsonResponse({ user: null, message: err?.message ?? '사용자 정보를 확인하지 못했습니다.' }, 500);
  }
};
