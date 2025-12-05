import { createClient } from '@supabase/supabase-js';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const classId = url.searchParams.get('class_id');

  if (!classId) {
    return jsonResponse({ error: 'class_id is required' }, 400);
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    global: { fetch: (...args) => fetch(...args) },
  });

  try {
    const { data: classStudents, error: classStudentsError } = await supabase
      .from('classes_students')
      .select('student_id')
      .eq('class_id', classId);

    if (classStudentsError) {
      throw classStudentsError;
    }

    const studentIds = Array.from(
      new Set((classStudents ?? []).map((row) => row.student_id).filter(Boolean)),
    );

    const { data: profiles, error: profilesError } = studentIds.length
      ? await supabase.from('profiles').select('id, name, email').in('id', studentIds)
      : { data: [], error: null };

    if (profilesError) {
      throw profilesError;
    }

    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id, student_id, session_no')
      .eq('class_id', classId);

    if (assignmentsError) {
      throw assignmentsError;
    }

    const maxSession = Math.max(
      0,
      ...(assignments ?? [])
        .map((a) => (typeof a.session_no === 'number' ? a.session_no : Number(a.session_no)))
        .filter((session) => Number.isFinite(session)),
    );

    const sessions = maxSession > 0 ? Array.from({ length: maxSession }, (_, i) => i + 1) : [];

    const submissions = (assignments ?? [])
      .filter((assignment) => assignment.student_id && assignment.session_no)
      .map((assignment) => ({
        student_id: assignment.student_id,
        session_no: assignment.session_no,
        assignment_id: assignment.id,
      }));

    return jsonResponse({
      students: profiles ?? [],
      sessions,
      submissions,
    });
  } catch (err: any) {
    return jsonResponse({ error: err?.message ?? 'Failed to load progress data' }, 500);
  }
};
