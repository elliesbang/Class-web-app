import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = (env: Record<string, string | undefined>) => {
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ??
    env.SUPABASE_KEY ??
    env.SUPABASE_ANON_KEY ??
    env.VITE_SUPABASE_SERVICE_ROLE_KEY ??
    env.VITE_SUPABASE_ANON_KEY;

  return createClient(url!, key!);
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function onRequest({ request, env }: { request: Request; env: Record<string, string | undefined> }) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await request.json();
    const rawAuth =
      request.headers.get('authorization') ||
      request.headers.get('Authorization');

    const token =
      rawAuth?.replace('Bearer ', '') ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ||
      undefined;

    const { assignment_id, content } = body as { assignment_id?: number; content?: string };
    if (!assignment_id || !content) {
      return jsonResponse({ error: 'assignment_id and content are required' }, 400);
    }

    const supabase = getSupabaseClient(env);
    const userResult = token ? await supabase.auth.getUser(token) : null;
    const adminId = userResult?.data.user?.id ?? null;

    const { data, error } = await supabase
      .from('assignment_feedbacks')
      .insert({ assignment_id, content, admin_id: adminId, created_at: new Date().toISOString() })
      .select()
      .single();

    if (error) {
      return jsonResponse({ error: 'Insert failed', details: error.message }, 500);
    }

    return jsonResponse({ feedback: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
};
