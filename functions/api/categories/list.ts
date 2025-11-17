import { handleApi, assertMethod, jsonResponse } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'GET');

    // 🔒 Authorization 체크
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const user = await verifyToken(request, env);
    assertRole(user, 'admin');

    // ✅ class_category 테이블에 실제로 있는 컬럼들과 일치하도록 수정
    const statement = env.DB.prepare(
      `SELECT 
          id,
          name,
          order_num,
          created_at,
          updated_at,
          type,
          parent_type
       FROM class_category
       ORDER BY type ASC, order_num ASC`
    );

    const { results } = await statement.all();

    return jsonResponse(results ?? []);
  });
