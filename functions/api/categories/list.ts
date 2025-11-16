import { handleApi, assertMethod, jsonResponse } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'GET');

    // 🔥 로그인 안 된 상태면 API 실행하지 않음
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      // 로그인 하지 않은 상태라면 빈 리스트 반환하거나 401 반환
      return jsonResponse([], 200);
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
