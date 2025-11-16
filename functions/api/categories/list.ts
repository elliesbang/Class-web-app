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

  try {
    const statement = env.DB.prepare(
      `SELECT id, name, order_num, created_at, updated_at
       FROM class_category
       ORDER BY order_num ASC`
    );

    const { results } = await statement.all();

    // 🔥 핵심: items가 아니라 배열 그대로 반환해야 함
    return jsonResponse(results ?? []);
  } catch (error) {
    return jsonResponse({ error: 'Failed to fetch categories' }, 500);
  }
};