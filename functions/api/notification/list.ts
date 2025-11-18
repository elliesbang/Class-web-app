import { handleApi, jsonResponse } from '../../_utils/api';
import { verifyToken } from '../../_utils/auth';

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    const user = await verifyToken(request, env);

    const { results } = await env.DB.prepare(
      `SELECT id, title, message, link_url, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`
    )
      .bind(user.user_id)
      .all();

    return jsonResponse(results);
  });