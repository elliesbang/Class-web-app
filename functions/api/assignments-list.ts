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

export async function onRequest({
  request,
  env,
}: {
  request: Request;
  env: Record<string, string | undefined>;
}) {
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const { searchParams } = new URL(request.url);

    // -------------------------
    // ✔ 프론트와 동일한 파라미터 이름(class_id)
    // -------------------------
    const classId = searchParams.get('class_id') || null;
    const studentId = searchParams.get('student_id') || null;
    const sessionNo = searchParams.get('session_no') || null;

    if (!classId) {
      return jsonResponse({ error: 'class_id is required' }, 400);
    }

    const supabase = getSupabaseClient(env);

    const { data: classStudents, error: classStudentsError } = await supabase
      .from('classes_students')
      .select('student_id')
      .eq('class_id', classId);

    if (classStudentsError) {
      return jsonResponse({ error: 'Failed to load class students', details: classStudentsError.message }, 500);
    }

    const allowedStudentIds = Array.from(new Set((classStudents ?? []).map((item) => item.student_id).filter(Boolean)));

    if (!studentId && allowedStudentIds.length === 0) {
      return jsonResponse({ assignments: [] });
    }

    if (studentId && allowedStudentIds.length && !allowedStudentIds.includes(studentId)) {
      return jsonResponse({ assignments: [] });
    }

    // -------------------------
    // ✔ assignments 기본 쿼리 (created_at desc)
    // -------------------------
    let query = supabase
      .from('assignments')
      .select(
        'id, class_id, classroom_id, student_id, session_no, type, text_content, image_url, link_url, status, created_at',
      )
      .order('created_at', { ascending: false });

    query = query.eq('class_id', classId);

    if (studentId) {
      query = query.eq('student_id', studentId);
    } else if (allowedStudentIds.length) {
      query = query.in('student_id', allowedStudentIds);
    }

    if (sessionNo) {
      query = query.eq('session_no', sessionNo);
    }

    const { data: assignments, error } = await query;

    if (error) {
      return jsonResponse(
        { error: 'Failed to load assignments', details: error.message },
        500
      );
    }

    //--------------------------
    // ✔ assignment_id 목록
    //--------------------------
    const assignmentIds = (assignments ?? [])
      .map((a) => a.id)
      .filter(Boolean);

    //--------------------------
    // ✔ student_id 목록 (profiles 매핑)
    //--------------------------
    const studentIds = Array.from(
      new Set((assignments ?? []).map((a) => a.student_id).filter(Boolean))
    );

    const [{ data: feedbacks }, { data: profiles }] = await Promise.all([
      assignmentIds.length
        ? supabase
            .from('assignment_feedbacks')
            .select(
              'id, assignment_id, content, created_at, admin_id'
            )
            .in('assignment_id', assignmentIds)
        : Promise.resolve({ data: [] }),

      studentIds.length
        ? supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', studentIds)
        : Promise.resolve({ data: [] }),
    ]);

    //--------------------------
    // ✔ Map 기반으로 매핑
    //--------------------------
    const profileMap = new Map();
    (profiles ?? []).forEach((p) => {
      if (p.id) profileMap.set(p.id, p);
    });

    const feedbackMap = new Map();
    (feedbacks ?? []).forEach((fb) => {
      const arr = feedbackMap.get(fb.assignment_id) ?? [];
      arr.push(fb);
      feedbackMap.set(fb.assignment_id, arr);
    });

    //--------------------------
    // ✔ enrich (AssignmentTab에서 필요함)
    //--------------------------
    const enriched = (assignments ?? []).map((assignment) => ({
      ...assignment,
      profiles: profileMap.get(assignment.student_id) ?? null,
      assignment_feedbacks: feedbackMap.get(assignment.id) ?? [],
    }));

    return jsonResponse({ assignments: enriched });
  } catch (err) {
    return jsonResponse(
      {
        error:
          err instanceof Error ? err.message : 'Unknown error',
      },
      500
    );
  }
};
