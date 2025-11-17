import { ApiError, assertMethod, handleApi, jsonResponse, requireJsonBody } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface Payload {
  category_id?: string | null;
  title?: string;
  description?: string | null;
  url?: string | null;
  is_recommended?: number | boolean | null;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'POST');

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    const user = await verifyToken(request, env);
    assertRole(user, 'admin');

    const body = await requireJsonBody<Payload>(request);
    if (!body.title || !body.url) {
      throw new ApiError(400, { error: 'title and url are required' });
    }

    const id = crypto.randomUUID();
    const isRecommendedValue = Number(body.is_recommended ?? 0) ? 1 : 0;

    await env.DB.prepare(
      `INSERT INTO vod_video 
      (id, category_id, title, description, url, is_recommended, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'), datetime('now'))`,
    )
      .bind(id, body.category_id ?? null, body.title, body.description ?? null, body.url, isRecommendedValue)
      .run();

    return jsonResponse({ id });
  });
