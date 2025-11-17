import { assertMethod, handleApi, jsonResponse } from '../../_utils/api';

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'GET');

    const statement = env.DB.prepare(
      `SELECT id, name, order_num
       FROM vod_category
       ORDER BY order_num ASC`,
    );

    const { results } = await statement.all();
    return jsonResponse(results ?? []);
  });
