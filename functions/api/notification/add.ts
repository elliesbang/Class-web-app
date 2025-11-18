import { handleApi, requireJsonBody, jsonResponse } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    const admin = await verifyToken(request, env);
    assertRole(admin, 'admin'); // 관리자만 알림 생성 가능

    const body = await requireJsonBody<{
      user_id: string;
      title?: string;
      message?: string;
      link_url?: string;
    }>(request);

    const id = crypto.randomUUID();
    const created = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO notifications (id, user_id, title, message, link_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(id, body.user_id, body.title, body.message, body.link_url, created)
      .run();

    return jsonResponse({ id });
  });