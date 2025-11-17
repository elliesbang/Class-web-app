import { ApiError, assertMethod, handleApi, jsonResponse } from '../../_utils/api';
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

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const class_id = url.searchParams.get('class_id');
    const type = url.searchParams.get('type');

    if (!id) throw new ApiError(400, { error: 'id is required' });

    // 안전 삭제
    await env.DB.prepare(
      `DELETE FROM classroom_content WHERE id = ?`
    ).bind(id).run();

    // 삭제된 후 최신 목록 반환
    let results = [];

    if (class_id && type) {
      const res = await env.DB.prepare(
        `SELECT * FROM classroom_content
         WHERE class_id = ? AND type = ?
         ORDER BY order_num ASC, created_at DESC`
      ).bind(class_id, type).all();
      results = res.results || [];
    }

    return jsonResponse({ id, results });
  });
