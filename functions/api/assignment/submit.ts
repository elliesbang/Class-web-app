import { ApiError, assertMethod, handleApi, jsonResponse, requireJsonBody } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';
import { uploadImage } from '../../_utils/uploadImage';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  [key: string]: unknown;
}

interface Payload {
  classroom_id?: string;
  student_id?: string;
  link_url?: string | null;
  image_base64?: string | null;
  session_no?: number | string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'POST');
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse([]);
    }

    const user = await verifyToken(request, env);
    assertRole(user, 'student');

    const body = await requireJsonBody<Payload>(request);
    const classroomId = body.classroom_id?.toString().trim();
    const studentId = body.student_id?.toString().trim();
    const sessionNo = Number(body.session_no);
    const linkUrl = body.link_url?.toString().trim() || null;
    const imageBase64 = body.image_base64?.toString().trim() || '';

    if (!classroomId) {
      throw new ApiError(400, { error: 'classroom_id is required' });
    }

    if (!studentId) {
      throw new ApiError(400, { error: 'student_id is required' });
    }

    if (!Number.isFinite(sessionNo)) {
      throw new ApiError(400, { error: 'session_no is required' });
    }

    if (sessionNo < 1 || sessionNo > 15) {
      throw new ApiError(400, { error: 'session_no must be between 1 and 15' });
    }

    if (!imageBase64 && !linkUrl) {
      throw new ApiError(400, { error: 'image_base64 or link_url is required' });
    }

    if (studentId !== user.user_id) {
      throw new ApiError(403, { error: 'student_id does not match authenticated user' });
    }

    let imageUrl: string | null = null;
    if (imageBase64) {
      imageUrl = await uploadImage(env, imageBase64);
    }

    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    await env.DB.prepare(
  `INSERT INTO assignments
   (id, classroom_id, student_id, session_no, image_url, link_url, created_at, updated_at)
   VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
)
.bind(id, classroomId, studentId, sessionNo, imageUrl, linkUrl, timestamp, timestamp)
.run();

// 🔥 저장된 과제 전체 데이터 반환
return jsonResponse({
  id,
  classroom_id: classroomId,
  student_id: studentId,
  session_no: sessionNo,
  image_url: imageUrl,
  link_url: linkUrl,
  created_at: timestamp,
  updated_at: timestamp,
});
