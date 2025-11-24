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

export const onRequest = async ({ request, env }: { request: Request; env: Record<string, string | undefined> }) => {
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const { searchParams } = new URL(request.url);

    // text 컬럼이므로 string 그대로 사용
    const classroomId = searchParams.get('classroom_id') || null;
    const studentId = searchParams.get('student_id') || null;
    const sessionNo = searchParams.get('session_no') || null;

    const supabase = getSupabaseClient(env);

    // created_at 최신순
    let query = supabase
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false });

    // 문자열로 비교 (절대 Number() 금지)
    if (classroomId) {
      query = query.eq('classroom_id', classroomId);
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
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

    // assignment IDs
    const assignmentIds = (assignments ?? [])
      .map((a) => a.id)
      .filter(Boolean);

    // student IDs (프로필 매핑)
    const studentIds = Array.from(
      new Set((assignments ?? []).map((a) => a.student_id).filter(Boolean))
    );

    const [{ data: feedbacks }, { data: profiles }] = await Promise.all([
      assignmentIds.length
        ? supabase
            .from('assignment_feedbacks')
            .select('id, assignment_id, content, created_at, admin_id')
            .in('assignment_id', assignmentIds)
        : Promise.resolve({ data: [] }),

      studentIds.length
        ? supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', studentIds)
        : Promise.resolve({ data: [] }),
    ]);

    // 맵핑 처리
    const profileMap = new Map();
    (profiles ?? []).forEach((p) => {
      if (p.id) profileMap.set(p.id, p);
    });

    const feedbackMap = new Map();
    (feedbacks ?? []).forEach((fb) => {
      const existing = feedbackMap.get(fb.assignment_id) ?? [];
      existing.push(fb);
      feedbackMap.set(fb.assignment_id, existing);
    });

    // enrichment
    const enriched = (assignments ?? []).map((assignment) => ({
      ...assignment,
      profiles: profileMap.get(assignment.student_id) ?? null,
      assignment_feedbacks: feedbackMap.get(assignment.id) ?? [],
    }));

    return jsonResponse({ assignments: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
};
