export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const classId = url.searchParams.get("class_id");

  if (!classId) {
    return new Response("Missing class_id", { status: 400 });
  }

  const db = env.DB;

  // ⭐ classes 테이블 실제 컬럼에 맞게 SELECT
  const classInfo = await db
    .prepare(
      `SELECT 
          id,
          name,
          code,
          category,
          category_id,
          start_date,
          end_date,
          duration,
          assignment_upload_time,
          assignment_upload_days,
          delivery_methods,
          is_active,
          created_at,
          updated_at
       FROM classes
       WHERE id = ?`
    )
    .bind(classId)
    .first();

  if (!classInfo) {
    return new Response("Class not found", { status: 404 });
  }

  // ⭐ classroom_content 테이블 실제 컬럼명에 맞게 SELECT
  const { results: contents } = await db
    .prepare(
      `SELECT
          id,
          classroom_id,
          type,
          title,
          description,
          content_url,
          thumbnail_url,
          order_num,
          created_at,
          updated_at
       FROM classroom_content
       WHERE classroom_id = ?
       ORDER BY order_num ASC`
    )
    .bind(classId)
    .all();

  return Response.json({
    class: classInfo,
    contents: contents ?? [],
  });
}
