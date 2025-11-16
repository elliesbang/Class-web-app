import { ApiError, assertMethod, handleApi, jsonResponse } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'GET');
    const user = await verifyToken(request, env);
    assertRole(user, ['student', 'admin']);

    const url = new URL(request.url);
    const categoryId = url.searchParams.get('category_id');
    if (!categoryId) {
      throw new ApiError(400, { error: 'category_id is required' });
    }

    const statement = env.DB.prepare(
      `SELECT id, category_id, name, description, order_num, thumbnail_url, created_at, updated_at
       FROM classroom
       WHERE category_id = ?1
       ORDER BY order_num ASC`,
    ).bind(categoryId);

    const { results } = await statement.all();
    return jsonResponse(results ?? []);
  });
