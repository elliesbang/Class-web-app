import { handleApi, requireJsonBody, jsonResponse } from '../../_utils/api';
import { verifyToken } from '../../_utils/auth';

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    const user = await verifyToken(request, env);

    const body = await requireJsonBody<{ id: string }>(request);

    await env.DB.prepare(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`
    )
      .bind(body.id, user.user_id)
      .run();

    return jsonResponse({ status: 'ok' });
  });