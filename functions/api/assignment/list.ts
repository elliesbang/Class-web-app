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
      `SELECT id, classroom_id, student_id, image_url, link_url, created_at
       FROM assignments
       WHERE classroom_id = ?1 AND student_id = ?2
       ORDER BY datetime(created_at) DESC`
    )
      .bind(classroomId, studentId)
      .all();

    return jsonArray(results ?? []);
  } catch (error) {
    return jsonArray([{ error: 'Failed to fetch assignments' }], 500);
  }
};
