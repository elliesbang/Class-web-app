import { createClient } from '@supabase/supabase-js';

export const onRequest = async ({ env }) => {
  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from('classroom_category')
      .select('*')
      .order('order_num', { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify({ categories: data }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
