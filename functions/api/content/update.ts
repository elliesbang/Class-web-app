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

    const body = await requireJsonBody<Record<string, unknown>>(request);
    const id = body.id as string | undefined;
    if (!id) {
      throw new ApiError(400, { error: 'id is required' });
    }

    const type = (body.type as string | undefined)?.toLowerCase();
    const rawVodCategoryId = body.vod_category_id as number | string | undefined;
    const vodCategoryId =
      type === 'vod'
        ? typeof rawVodCategoryId === 'number'
          ? rawVodCategoryId
          : Number(rawVodCategoryId ?? '')
        : type
          ? null
          : undefined;
    const vodCategoryValue =
      vodCategoryId === undefined ? undefined : Number.isFinite(vodCategoryId) ? vodCategoryId : null;

    const allowedFields = [
      'classroom_id',
      'type',
      'title',
      'description',
      'content_url',
      'thumbnail_url',
      'order_num',
      'vod_category_id',
    ];

    const updates: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      if (field === 'vod_category_id') {
        if (vodCategoryValue !== undefined) {
          updates.push(`${field} = ?${updates.length + 1}`);
          values.push(vodCategoryValue);
        }
        continue;
      }
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
