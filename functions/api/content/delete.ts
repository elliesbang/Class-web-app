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

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return jsonResponse({ error: 'id is required' }, 400);
  }

  try {
    await env.DB.prepare(
      `DELETE FROM classroom_content WHERE id = ?`
    )
      .bind(id)
      .run();

    return jsonResponse({ id });
  } catch (error) {
    return jsonResponse({ error: 'Failed to delete content' }, 500);
  }
};
