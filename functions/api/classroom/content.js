export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const classId = url.searchParams.get('class_id');
  const tab = url.searchParams.get('tab');

  if (!classId || !tab) {
    return new Response('Missing class_id or tab', { status: 400 });
  }

  const db = env.DB;

  if (tab === "assignment") {
    const { results } = await db
      .prepare(
        `SELECT * FROM assignments
     WHERE classroom_id = ?
     ORDER BY datetime(created_at) DESC`
      )
      .bind(classId)
      .all();
    return Response.json(results ?? []);
  }

  if (tab === "feedback") {
    const { results } = await db
      .prepare(
        `SELECT f.*, a.session_no
     FROM feedback f
     LEFT JOIN assignments a ON a.id = f.assignment_id
     WHERE a.classroom_id = ?
     ORDER BY datetime(f.created_at) DESC`
      )
      .bind(classId)
      .all();
    return Response.json(results ?? []);
  }

  // 탭 → 실제 테이블명 매핑
  const tableMap = {
    globalNotice: 'global_notice',
    classroomVideo: 'classroom_video',
    vodVideo: 'vod_video',
    material: 'material',
    classroomNotice: 'classroom_notice',
  };

  const tableName = tableMap[tab];
  if (!tableName) {
    return Response.json([]);
  }

  const stmt = db.prepare(
    `SELECT id, classroom_id, class_id, type, title, description,
            content_url, thumbnail_url, order_num, created_at, updated_at
     FROM ${tableName}
     WHERE class_id = ? OR classroom_id = ?
     ORDER BY COALESCE(order_num, 0) ASC, created_at DESC`
  ).bind(classId, classId);

  const { results } = await stmt.all();
  return Response.json(results ?? []);
}
