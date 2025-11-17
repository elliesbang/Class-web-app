import { ApiError, handleApi, jsonResponse, requireJsonBody } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface Payload {
  id?: string;
  category_id?: string | null;
  title?: string;
  description?: string | null;
  url?: string | null;
  is_recommended?: number | boolean | null;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    if (!['POST', 'PUT'].includes(request.method.toUpperCase())) {
      throw new ApiError(405, { error: 'Method Not Allowed' });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    const user = await verifyToken(request, env);
    assertRole(user, 'admin');

    const body = await requireJsonBody<Payload>(request);
    if (!body.id) {
      throw new ApiError(400, { error: 'id is required' });
    }

    const values = [
      body.category_id ?? null,
      body.title ?? null,
      body.description ?? null,
      body.url ?? null,
      Number(body.is_recommended ?? 0) ? 1 : 0,
      body.id,
    ];

    await env.DB.prepare(
      `UPDATE vod_video
       SET category_id=?, title=?, description=?, url=?, is_recommended=?, updated_at=datetime('now')
       WHERE id=?`,
    )
      .bind(...values)
      .run();

    return jsonResponse({ id: body.id });
  });
