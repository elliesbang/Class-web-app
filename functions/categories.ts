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
    return jsonResponse({ categories: [] });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    global: { fetch: (...args) => fetch(...args) },
  });

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData?.user) {
      return jsonResponse({ categories: [] });
    }

    const { data, error } = await supabase
      .from('class_category')
      .select('*')
      .order('order_num', { ascending: true });

    if (error) {
      throw error;
    }

    return jsonResponse({ categories: data ?? [] });
  } catch (err: any) {
    return jsonResponse({ message: err?.message ?? '카테고리를 불러오지 못했습니다.', categories: [] }, 500);
  }
};
