interface Env {
  DB: D1Database;
  ADMIN_TOKEN: string;
}

const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const requireAuth = (request: Request, env: Env): Response | null => {
  const header = request.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const token = header.slice('Bearer '.length).trim();
  if (token !== env.ADMIN_TOKEN) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  return null;
};

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  const authError = requireAuth(request, env);
  if (authError) {
    return authError;
  }

  let body: {
    classroom_id?: string | null;
    type?: string;
    title?: string;
    description?: string | null;
    content_url?: string | null;
    thumbnail_url?: string | null;
    order_num?: number | null;
  };

  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { classroom_id, type, title, description, content_url, thumbnail_url, order_num } = body;

  if (!type || !title) {
    return jsonResponse({ error: 'type and title are required' }, 400);
  }

  const id = crypto.randomUUID();

  try {
    await env.DB.prepare(
      `INSERT INTO classroom_content
      (id, classroom_id, type, title, description, content_url, thumbnail_url, order_num, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
      .bind(
        id,
        classroom_id ?? null,
        type,
        title,
        description ?? null,
        content_url ?? null,
        thumbnail_url ?? null,
        order_num ?? null
      )
      .run();

    return jsonResponse({ id });
  } catch (error) {
    return jsonResponse({ error: 'Failed to add content' }, 500);
  }
};
