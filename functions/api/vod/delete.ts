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
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    const user = await verifyToken(request, env);
    assertRole(user, 'admin');

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      throw new ApiError(400, { error: 'id is required' });
    }

    await env.DB.prepare(`DELETE FROM vod_video WHERE id = ?1`).bind(id).run();
    return jsonResponse({ id });
  });
