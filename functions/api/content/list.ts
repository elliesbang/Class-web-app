export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const classId = url.searchParams.get("class_id");
  const tab = url.searchParams.get("tab");

  if (!classId || !tab) {
    return Response.json([]);
  }

  const db = env.DB;

  // TAB 처리
  switch (tab) {

    case "globalNotice": {
      const { results } = await db.prepare(
        `SELECT id, class_id, title, content, created_at 
         FROM global_notice
         WHERE class_id = ?
         ORDER BY datetime(created_at) DESC`
      ).bind(classId).all();
      return Response.json(results ?? []);
    }

    case "classroomVideo": {
      const { results } = await db.prepare(
        `SELECT id, class_id, title, url, thumbnail_url, order_num, created_at
         FROM classroom_video
         WHERE class_id = ?
         ORDER BY COALESCE(order_num, 0) ASC, datetime(created_at) DESC`
      ).bind(classId).all();
      return Response.json(results ?? []);
    }

    case "material": {
      const { results } = await db.prepare(
        `SELECT id, class_id, title, file_url, created_at
         FROM material
         WHERE class_id = ?
         ORDER BY datetime(created_at) DESC`
      ).bind(classId).all();
      return Response.json(results ?? []);
    }

    case "classroomNotice": {
      const { results } = await db.prepare(
        `SELECT id, class_id, content, created_at
         FROM classroom_notice
         WHERE class_id = ?
         ORDER BY datetime(created_at) DESC`
      ).bind(classId).all();
      return Response.json(results ?? []);
    }

    // VOD는 class_id가 아님
    case "vodVideo": {
      const { results } = await db.prepare(
        `SELECT id, vod_category_id, title, url, thumbnail_url, order_num, created_at
         FROM vod_video
         ORDER BY COALESCE(order_num, 0) ASC, datetime(created_at) DESC`
      ).all();
      return Response.json(results ?? []);
    }

    default:
      return Response.json([]);
  }
}
