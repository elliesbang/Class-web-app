export async function onRequestGet(context) {
  try {
    // D1 데이터베이스 인스턴스 가져오기
    const db = context.env.DB;

    // classes 테이블에서 categoryId, id 순으로 정렬된 결과 가져오기
    const { results } = await db.prepare(`
      SELECT id, name, categoryId
      FROM classes
      ORDER BY categoryId ASC, id ASC;
    `).all();

    // 응답 반환 (UTF-8 JSON)
    return new Response(JSON.stringify(results, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    // 에러 발생 시 로그와 함께 에러 메시지 반환
    console.error("❌ Error fetching classes:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch classes", details: err.message }),
      { status: 500, headers: { "content-type": "application/json; charset=utf-8" } }
    );
  }
}
