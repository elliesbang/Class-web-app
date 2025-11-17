import { assertMethod, handleApi, jsonResponse, requireJsonBody } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface Payload {
  class_id?: string | null;
  classroom_id?: string | null;
  type?: string;
  title?: string;
  description?: string | null;
  content_url?: string | null;
  url?: string | null;
  thumbnail_url?: string | null;
  order_num?: number | null;
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

    const body = await requireJsonBody<Payload>(request);

    // class_id와 classroom_id 자동 통합 처리
    const classId =
      body.class_id ??
      body.classroom_id ??
      null;

    if (!classId) {
      return jsonResponse({ error: 'Missing class_id' }, 400);
    }

    // url / content_url / thumbnail_url / description 정규화
    const resolvedUrl =
      body.content_url ??
      body.url ??
      null;

    const resolvedThumbnail =
      body.thumbnail_url ?? null;

    const resolvedDescription =
      body.description ?? null;

    const orderNum = body.order_num ?? 0;

    const type = body.type ?? '';
    const title = body.title ?? '';

    // created_at / updated_at 강제 설정
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO classroom_content
        (class_id, type, title, description, content_url, thumbnail_url, order_num, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        classId,
        type,
        title,
        resolvedDescription,
        resolvedUrl,
        resolvedThumbnail,
        orderNum,
        now,
        now
      )
      .run();

    // 저장 후 최신 목록 반환
    const { results } = await env.DB.prepare(
      `SELECT * FROM classroom_content
       WHERE class_id = ? AND type = ?
       ORDER BY order_num ASC, created_at DESC`
    )
      .bind(classId, type)
      .all();

    return jsonResponse({ results });
  });
