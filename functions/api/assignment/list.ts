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

    const conditions = ['classroom_id = ?1'];
    const bindings: unknown[] = [classroomId];

    if (studentId) {
      conditions.push('student_id = ?2');
      bindings.push(studentId);
    }

    const query = `
      SELECT id, classroom_id, student_id, image_url, link_url, created_at
      FROM assignments
      WHERE ${conditions.join(' AND ')}
      ORDER BY datetime(created_at) DESC
    `;

    const { results } = await env.DB.prepare(query).bind(...bindings).all();
    return jsonResponse(results ?? []);
  });
