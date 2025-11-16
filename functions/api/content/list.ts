interface Env {
  DB: D1Database;
}

const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  const url = new URL(request.url);
  const classroomId = url.searchParams.get('classroom_id');

  try {
    let statement;
    if (classroomId) {
      statement = env.DB.prepare(
        `SELECT id, classroom_id, type, title, description, content_url, thumbnail_url, order_num, created_at, updated_at
         FROM classroom_content
         WHERE classroom_id = ?
         ORDER BY order_num ASC`
      ).bind(classroomId);
    } else {
      statement = env.DB.prepare(
        `SELECT id, classroom_id, type, title, description, content_url, thumbnail_url, order_num, created_at, updated_at
         FROM classroom_content
         WHERE classroom_id IS NULL
         ORDER BY order_num ASC`
      );
    }

    const { results } = await statement.all();
    return jsonResponse({ items: results ?? [] });
  } catch (error) {
    return jsonResponse({ error: 'Failed to fetch content' }, 500);
  }
};
