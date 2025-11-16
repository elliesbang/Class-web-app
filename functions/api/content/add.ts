import { ApiError, assertMethod, handleApi, jsonResponse, requireJsonBody } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface Payload {
  classroom_id?: string | null;
  type?: string;
  title?: string;
  description?: string | null;
  content_url?: string | null;
  thumbnail_url?: string | null;
  order_num?: number | null;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'POST');
    const user = await verifyToken(request, env);
    assertRole(user, 'admin');

    const body = await requireJsonBody<Payload>(request);
    if (!body.type || !body.title) {
      throw new ApiError(400, { error: 'type and title are required' });
    }

    const id = crypto.randomUUID();

    await env.DB.prepare(
      `INSERT INTO classroom_content
      (id, classroom_id, type, title, description, content_url, thumbnail_url, order_num, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'), datetime('now'))`,
    )
      .bind(
        id,
        body.classroom_id ?? null,
        body.type,
        body.title,
        body.description ?? null,
        body.content_url ?? null,
        body.thumbnail_url ?? null,
        body.order_num ?? null,
      )
      .run();

    return jsonResponse({ id });
  });
