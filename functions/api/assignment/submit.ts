interface Env {
  DB: D1Database;
}

const jsonArray = (data: unknown[], status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return jsonArray([{ error: 'Method Not Allowed' }], 405);
  }

  let payload: any = {};
  try {
    payload = await request.json();
  } catch (error) {
    return jsonArray([{ error: 'Invalid JSON body' }], 400);
  }

  const classroomId = payload?.classroom_id?.toString().trim();
  const studentId = payload?.student_id?.toString().trim();
  const imageUrl = payload?.image_url ? payload.image_url.toString() : null;
  const linkUrl = payload?.link_url ? payload.link_url.toString() : null;

  if (!classroomId || !studentId) {
    return jsonArray([{ error: 'classroom_id and student_id are required' }], 400);
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  try {
    await env.DB.prepare(
      `INSERT INTO assignments (id, classroom_id, student_id, image_url, link_url, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
    )
      .bind(id, classroomId, studentId, imageUrl, linkUrl, createdAt)
      .run();

    const { results } = await env.DB.prepare(
      `SELECT id, classroom_id, student_id, image_url, link_url, created_at
       FROM assignments
       WHERE id = ?1`
    )
      .bind(id)
      .all();

    return jsonArray(results ?? []);
  } catch (error) {
    return jsonArray([{ error: 'Failed to submit assignment' }], 500);
  }
};
