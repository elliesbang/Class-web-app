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

    if (!classroomId) {
      throw new ApiError(400, { error: 'classroom_id is required' });
    }

    const { results } = await env.DB.prepare(
      `SELECT f.*, a.session_no
FROM feedback f
LEFT JOIN assignments a ON a.id = f.assignment_id
WHERE a.classroom_id = ?
ORDER BY datetime(f.created_at) DESC`
    )
      .bind(classroomId)
      .all();

    return jsonResponse(results ?? []);
  });
