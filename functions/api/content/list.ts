import { handleApi, assertMethod, jsonResponse } from '../../_utils/api';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'GET');

    const url = new URL(request.url);
    const classroomId = url.searchParams.get('classroom_id');

    let statement;
    if (classroomId) {
      statement = env.DB.prepare(
        `SELECT id, classroom_id, type, title, description, content_url, thumbnail_url, vod_category_id, order_num, created_at, updated_at
         FROM classroom_content
         WHERE classroom_id = ?1 OR classroom_id IS NULL
         ORDER BY COALESCE(order_num, 0) ASC, created_at DESC`,
      ).bind(classroomId);
    } else {
      statement = env.DB.prepare(
        `SELECT id, classroom_id, type, title, description, content_url, thumbnail_url, vod_category_id, order_num, created_at, updated_at
         FROM classroom_content
         ORDER BY COALESCE(order_num, 0) ASC, created_at DESC`,
      );
    }

    const { results } = await statement.all();
    return jsonResponse(results ?? []);
  });
