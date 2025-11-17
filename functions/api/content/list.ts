import { handleApi, assertMethod, jsonResponse } from '../../_utils/api';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'GET');

    const url = new URL(request.url);

    // class_id 우선, 없으면 classroom_id 사용
    const classId =
      url.searchParams.get('class_id') ??
      url.searchParams.get('classroom_id') ??
      null;

    let statement;

    if (classId) {
      // 🔥 class_id + classroom_id 둘 다 읽음 (호환 모드)
      statement = env.DB.prepare(
        `SELECT id, class_id, classroom_id, type, title, description, 
                content_url, thumbnail_url, vod_category_id, order_num, created_at, updated_at
         FROM classroom_content
         WHERE class_id = ?1 OR classroom_id = ?1
         ORDER BY COALESCE(order_num, 0) ASC, created_at DESC`
      ).bind(classId);
    } else {
      // 전체 조회
      statement = env.DB.prepare(
        `SELECT id, class_id, classroom_id, type, title, description, 
                content_url, thumbnail_url, vod_category_id, order_num, created_at, updated_at
         FROM classroom_content
         ORDER BY COALESCE(order_num, 0) ASC, created_at DESC`
      );
    }

    const { results } = await statement.all();

    return jsonResponse(results ?? []);
  });
