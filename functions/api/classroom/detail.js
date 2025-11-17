export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const classId = url.searchParams.get('class_id');

  if (!classId) {
    return new Response('Missing class_id', { status: 400 });
  }

  const db = env.DB;

  // 🚀 classes 테이블에서 기본 정보 조회
  const classInfo = await db
    .prepare(
      `SELECT 
          id,
          name,
          code,
          category,
          startDate,
          endDate,
          assignmentUploadTime,
          assignmentUploadDays,
          isActive,
          createdAt,
          updatedAt
       FROM classes
       WHERE id = ?`
    )
    .bind(classId)
    .first();

  if (!classInfo) {
    return new Response('Class not found', { status: 404 });
  }

  // 🚀 classroom_content에서 해당 class의 콘텐츠 조회
  const { results: contents } = await db
    .prepare(
      `SELECT 
          id,
          class_id,
          type,
          title,
          url,
          order_num,
          created_at,
          updated_at
       FROM classroom_content
       WHERE class_id = ?
       ORDER BY order_num ASC`
    )
    .bind(classId)
    .all();

  return Response.json({
    class: classInfo,
    contents: contents ?? [],
  });
}
