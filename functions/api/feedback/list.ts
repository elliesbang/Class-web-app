interface Env {
  DB: D1Database;
}

const jsonArray = (data: unknown[], status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== 'GET') {
    return jsonArray([{ error: 'Method Not Allowed' }], 405);
  }

  const url = new URL(request.url);
  const classroomId = url.searchParams.get('classroom_id');
  const studentId = url.searchParams.get('student_id');

  if (!classroomId || !studentId) {
    return jsonArray([{ error: 'classroom_id and student_id are required' }], 400);
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT f.id, f.assignment_id, f.feedback, f.created_at, a.image_url, a.link_url
       FROM assignment_feedback f
       INNER JOIN assignments a ON f.assignment_id = a.id
       WHERE a.classroom_id = ?1 AND a.student_id = ?2
       ORDER BY datetime(f.created_at) DESC`
    )
      .bind(classroomId, studentId)
      .all();

    return jsonArray(results ?? []);
  } catch (error) {
    return jsonArray([{ error: 'Failed to fetch feedback' }], 500);
  }
};
