export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const classId = url.searchParams.get('class_id');
  const tab = url.searchParams.get('tab');

  if (!classId || !tab) {
    return new Response('Missing class_id or tab', { status: 400 });
  }

  const db = env.DB;

  // 📌 assignment (제출 목록)
  if (tab === "assignment") {
    const { results } = await db
      .prepare(
        `SELECT *
         FROM assignments
         WHERE classroom_id = ?
         ORDER BY datetime(created_at) DESC`
      )
      .bind(classId)
      .all();

    return Response.json(results ?? []);
  }

  // 📌 feedback (피드백)
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

  // 📌 탭 → type 매핑
  const typeMap = {
    globalNotice: 'globalNotice',
    classroomVideo: 'video',
    classroomNotice: 'classroom_notice',
    material: 'material',
  };

  const mappedType = typeMap[tab];

  if (!mappedType) {
    return Response.json([]);
  }

  // 📌 이제 통합 테이블에서 type으로 조회
  const { results } = await db
    .prepare(
      `SELECT *
       FROM classroom_content
       WHERE (class_id = ? OR classroom_id = ?)
       AND type = ?
       ORDER BY COALESCE(order_num, 0) ASC, created_at DESC`
    )
    .bind(classId, classId, mappedType)
    .all();

  return Response.json(results ?? []);
}
