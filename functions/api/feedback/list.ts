import { ApiError, assertMethod, handleApi, jsonResponse } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'GET');
    // 🔥 Authorization 체크 추가
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse([]);
    }
    const user = await verifyToken(request, env);
    assertRole(user, ['student', 'admin']);

    const url = new URL(request.url);
    const classroomId = url.searchParams.get('classroom_id');
    let studentId = url.searchParams.get('student_id');

    if (!classroomId) {
      throw new ApiError(400, { error: 'classroom_id is required' });
    }

    if (user.role === 'student') {
      studentId = user.user_id;
    }

    if (!studentId) {
      throw new ApiError(400, { error: 'student_id is required' });
    }

    const { results } = await env.DB.prepare(
      `SELECT f.id, f.assignment_id, f.feedback, f.created_at, a.image_url, a.link_url, a.student_id
       FROM assignment_feedback f
       INNER JOIN assignments a ON f.assignment_id = a.id
       WHERE a.classroom_id = ?1 AND a.student_id = ?2
       ORDER BY datetime(f.created_at) DESC`,
    )
      .bind(classroomId, studentId)
      .all();

    return jsonResponse(results ?? []);
  });
