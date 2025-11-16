import { ApiError, assertMethod, handleApi, jsonResponse, requireJsonBody } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface Payload {
  classroom_id?: string;
  link_url?: string | null;
  image_url?: string | null;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'POST');
    const user = await verifyToken(request, env);
    assertRole(user, 'student');

    const body = await requireJsonBody<Payload>(request);
    const classroomId = body.classroom_id?.toString().trim();
    if (!classroomId) {
      throw new ApiError(400, { error: 'classroom_id is required' });
    }

    const linkUrl = body.link_url ? body.link_url.toString() : null;
    const imageUrl = body.image_url ? body.image_url.toString() : null;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO assignments (id, classroom_id, student_id, image_url, link_url, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
      .bind(id, classroomId, user.user_id, imageUrl, linkUrl, createdAt)
      .run();

    return jsonResponse({ id, classroom_id: classroomId, student_id: user.user_id });
  });
