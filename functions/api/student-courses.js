import { createClient } from '@supabase/supabase-js';

const getClient = (env) =>
  createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export async function onRequest({ request, env }) {
  try {
    const supabase = getClient(env);

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('week', { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ items: data }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message }), { status: 500 });
  }
};
