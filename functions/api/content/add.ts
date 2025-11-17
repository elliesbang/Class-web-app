import { assertMethod, handleApi, jsonResponse, requireJsonBody } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface Payload {
  classroom_id?: string | null;
  class_id?: string | null;
  type?: string;
  title?: string;
  description?: string | null;
  url?: string | null;
  content_url?: string | null;
  order_num?: number | null;
  vod_category_id?: string | null;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'POST');
    // 🔥 Authorization 체크 추가
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    const user = await verifyToken(request, env);
    assertRole(user, 'admin');

    const { vod_category_id: _vod_category_id, ...body } = await requireJsonBody<Payload>(request);

    const {
      class_id = body?.classroom_id ?? 0,
      type = '',
      title = '',
      url: rawUrl = '',
      content_url = '',
      description = '',
      order_num = 0,
    } = body || {};

    const resolvedClassId =
      (body as Record<string, unknown>).class_id ?? body.classroom_id ?? class_id ?? 0;
    const resolvedUrl =
      (body as Record<string, unknown>).url ?? rawUrl ?? content_url ?? description ?? '';

    await env.DB.prepare(
      `INSERT INTO classroom_content
      (class_id, type, title, url, order_num)
      VALUES (?, ?, ?, ?, ?)`
    )
      .bind(resolvedClassId, type, title, resolvedUrl, order_num)
      .run();

    const { results } = await env.DB.prepare(
      `SELECT * FROM classroom_content
       WHERE class_id = ? AND type = ?
       ORDER BY order_num ASC, created_at DESC`
    )
      .bind(resolvedClassId, type)
      .all();

    return jsonResponse({ results });
  });
