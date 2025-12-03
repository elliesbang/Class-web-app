import { createClient } from '@supabase/supabase-js';

export async function onRequest({ params, env }) {
  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    const classId = params.id;
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });

    return new Response(JSON.stringify({ classInfo: data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
