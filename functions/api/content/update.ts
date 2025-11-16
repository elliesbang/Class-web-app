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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const id = body.id as string | undefined;
  if (!id) {
    return jsonResponse({ error: 'id is required' }, 400);
  }

  const allowedFields = [
    'classroom_id',
    'type',
    'title',
    'description',
    'content_url',
    'thumbnail_url',
    'order_num',
  ];

  const updates: string[] = [];
  const values: unknown[] = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      updates.push(`${field} = ?`);
      values.push((body as Record<string, unknown>)[field]);
    }
  }

  if (updates.length === 0) {
    return jsonResponse({ error: 'No fields provided for update' }, 400);
  }

  updates.push("updated_at = datetime('now')");

  try {
    await env.DB.prepare(
      `UPDATE classroom_content
       SET ${updates.join(', ')}
       WHERE id = ?`
    )
      .bind(...values, id)
      .run();

    return jsonResponse({ id });
  } catch (error) {
    return jsonResponse({ error: 'Failed to update content' }, 500);
  }
};
