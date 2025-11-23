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
    const classroomId = searchParams.get('classroom_id');
    const studentId = searchParams.get('student_id');
    const sessionNo = searchParams.get('session_no');

    const supabase = getSupabaseClient(env);
    let query = supabase.from('assignments').select('*').order('created_at', { ascending: false });

    if (classroomId) {
      query = query.eq('classroom_id', Number(classroomId));
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (sessionNo) {
      query = query.eq('session_no', Number(sessionNo));
    }

    const { data: assignments, error } = await query;

    if (error) {
      return jsonResponse({ error: 'Failed to load assignments', details: error.message }, 500);
    }

    const assignmentIds = (assignments ?? []).map((item) => item.id).filter(Boolean);
    const studentIds = Array.from(new Set((assignments ?? []).map((item) => item.student_id).filter(Boolean)));

    const [{ data: feedbacks }, { data: profiles }] = await Promise.all([
      assignmentIds.length
        ? supabase
            .from('assignment_feedbacks')
            .select('id, assignment_id, content, created_at, admin_id')
            .in('assignment_id', assignmentIds)
        : Promise.resolve({ data: [], error: null }),
      studentIds.length
        ? supabase.from('profiles').select('id, name, email').in('id', studentIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const profileMap = new Map<string, { id?: string; name?: string | null; email?: string | null }>();
    (profiles ?? []).forEach((profile) => {
      if (profile.id) {
        profileMap.set(profile.id, profile as { id?: string; name?: string | null; email?: string | null });
      }
    });

    const feedbackMap = new Map<number, { id: number; content?: string | null; created_at?: string | null; admin_id?: string | null }[]>();
    (feedbacks ?? []).forEach((item) => {
      if (!item.assignment_id) return;
      const list = feedbackMap.get(item.assignment_id) ?? [];
      list.push(item);
      feedbackMap.set(item.assignment_id, list);
    });

    const enriched = (assignments ?? []).map((assignment) => ({
      ...assignment,
      profiles: profileMap.get(assignment.student_id),
      assignment_feedbacks: feedbackMap.get(assignment.id) ?? [],
    }));

    return jsonResponse({ assignments: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
};
