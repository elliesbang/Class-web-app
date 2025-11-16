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

  try {
    let statement;
    if (classroomId) {
      statement = env.DB.prepare(
        `SELECT id, classroom_id, type, title, description, content_url, thumbnail_url, order_num, created_at, updated_at
         FROM classroom_content
         WHERE classroom_id = ?1 OR classroom_id IS NULL
         ORDER BY COALESCE(order_num, 0) ASC, created_at DESC`
      ).bind(classroomId);
    } else {
      statement = env.DB.prepare(
        `SELECT id, classroom_id, type, title, description, content_url, thumbnail_url, order_num, created_at, updated_at
         FROM classroom_content
         ORDER BY COALESCE(order_num, 0) ASC, created_at DESC`
      );
    }

    const { results } = await statement.all();
    return jsonArray((results ?? []) as unknown[]);
  } catch (error) {
    return jsonArray([{ error: 'Failed to fetch content' }], 500);
  }
};
