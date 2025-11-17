import { ApiError, assertMethod, handleApi, jsonResponse, requireJsonBody } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
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

    const { vod_category_id: _vod_category_id, ...rawBody } = await requireJsonBody<Record<string, unknown>>(request);
    const id = rawBody.id as string | undefined;
    if (!id) {
      throw new ApiError(400, { error: 'id is required' });
    }

    const body = {
      ...rawBody,
      url: rawBody.url ?? rawBody.content_url ?? rawBody.description,
    } as Record<string, unknown>;

    const allowedFields = ['type', 'title', 'url', 'order_num'];

    const updates: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates.push(`${field} = ?${updates.length + 1}`);
        values.push((body as Record<string, unknown>)[field]);
      }
    }

    if (updates.length === 0) {
      throw new ApiError(400, { error: 'No fields provided for update' });
    }

    updates.push("updated_at = datetime('now')");

    const query = `UPDATE classroom_content SET ${updates.join(', ')} WHERE id = ?${values.length + 1}`;

    await env.DB.prepare(query).bind(...values, id).run();
    return jsonResponse({ id });
  });
