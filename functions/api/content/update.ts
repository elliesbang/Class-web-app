import { ApiError, assertMethod, handleApi, jsonResponse, requireJsonBody } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'POST');

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401);

    const user = await verifyToken(request, env);
    assertRole(user, 'admin');

    const rawBody = await requireJsonBody<Record<string, unknown>>(request);
    const id = rawBody.id as string | undefined;

    if (!id) {
      throw new ApiError(400, { error: 'id is required' });
    }

    // content_url / description / thumbnail_url 통합 정규화
    const description = (rawBody.description as string) ?? null;
    const contentUrl =
      (rawBody.content_url as string) ??
      (rawBody.url as string) ??
      null;
    const thumbnailUrl = (rawBody.thumbnail_url as string) ?? null;
    const title = (rawBody.title as string) ?? null;
    const type = (rawBody.type as string) ?? null;
    const orderNum = rawBody.order_num ?? null;

    const now = new Date().toISOString();

    const updates: string[] = [];
    const values: unknown[] = [];

    const apply = (column: string, value: unknown) => {
      if (value !== undefined && value !== null) {
        updates.push(`${column} = ?${updates.length + 1}`);
        values.push(value);
      }
    };

    apply("title", title);
    apply("type", type);
    apply("description", description);
    apply("content_url", contentUrl);
    apply("thumbnail_url", thumbnailUrl);
    apply("order_num", orderNum);

    // updated_at
    updates.push(`updated_at = ?${updates.length + 1}`);
    values.push(now);

    if (updates.length === 1) {
      throw new ApiError(400, { error: 'No fields provided for update' });
    }

    const query = `
      UPDATE classroom_content
      SET ${updates.join(', ')}
      WHERE id = ?${values.length + 1}
    `;

    await env.DB.prepare(query).bind(...values, id).run();
    return jsonResponse({ id });
  });
