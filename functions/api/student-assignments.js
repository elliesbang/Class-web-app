import { createClient } from '@supabase/supabase-js';

const getClient = (env) =>
  createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export async function onRequest({ request, env }) {
  try {
    const supabase = getClient(env);
    const url = new URL(request.url);
    const studentId = url.searchParams.get('student');
    const classId = url.searchParams.get('class_id') || url.searchParams.get('classId');

    if (!studentId || !classId) {
      return new Response(JSON.stringify({ error: 'Missing student or class id' }), {
        status: 400,
      });
    }

    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

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
