import { handleApi, assertMethod, jsonResponse } from '../../_utils/api';
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
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const user = await verifyToken(request, env);
    assertRole(user, 'admin');

    const statement = env.DB.prepare(
      `SELECT id, name, order_num, created_at, updated_at
       FROM class_category
       ORDER BY order_num ASC`,
    );

    const { results } = await statement.all();
    return jsonResponse(results ?? []);
  });
