import { assertMethod, handleApi, jsonResponse } from '../../_utils/api';

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'GET');

    const url = new URL(request.url);
    const vodCategoryId = url.searchParams.get('vod_category_id');

    const statement = vodCategoryId
      ? env.DB.prepare(
          `SELECT id, title, description, content_url, thumbnail_url, vod_category_id, created_at, order_num
           FROM classroom_content
           WHERE type = 'vod' AND vod_category_id = ?1
           ORDER BY COALESCE(order_num, 0) ASC, created_at DESC`,
        ).bind(vodCategoryId)
      : env.DB.prepare(
          `SELECT id, title, description, content_url, thumbnail_url, vod_category_id, created_at, order_num
           FROM classroom_content
           WHERE type = 'vod'
           ORDER BY COALESCE(order_num, 0) ASC, created_at DESC`,
        );

    const { results } = await statement.all();
    return jsonResponse(results ?? []);
  });
