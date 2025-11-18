export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const classId = url.searchParams.get("class_id");

  if (!classId) {
    return new Response("Missing class_id", { status: 400 });
  }

  const db = env.DB;

  // 1) content 테이블에서 type 목록 가져오기
  const { results } = await db
    .prepare(
      `SELECT DISTINCT type
       FROM classroom_content
       WHERE classroom_id = ?
       ORDER BY type ASC`
    )
    .bind(classId)
    .all();

  const rows = results ?? [];

  // 2) 프론트가 요구하는 형태로 변환
  const tabs = rows.map((row) => {
    const type = row.type;

    // 라벨 자동 매핑
    const labelMap = {
      video: "강의실 영상",
      notice: "강의실 공지",
      material: "자료",
      assignment: "과제",
      feedback: "피드백",
    };

    return {
      tab: type,
      label: labelMap[type] ?? type,
    };
  });

  return Response.json(tabs);
}
