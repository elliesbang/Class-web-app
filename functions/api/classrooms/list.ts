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
  const categoryId = url.searchParams.get('category_id');
  if (!categoryId) {
    return jsonResponse({ error: 'category_id is required' }, 400);
  }

  try {
    const statement = env.DB.prepare(
      `SELECT id, category_id, name, description, order_num, thumbnail_url, created_at, updated_at
       FROM classroom
       WHERE category_id = ?
       ORDER BY order_num ASC`
    ).bind(categoryId);

    const { results } = await statement.all();
    return jsonResponse({ items: results ?? [] });
  } catch (error) {
    return jsonResponse({ error: 'Failed to fetch classrooms' }, 500);
  }
};
