export async function onRequestGet(context) {
  const { env } = context;

  try {
    // D1 데이터베이스에서 모든 클래스 불러오기
    const { results } = await env.DB.prepare(
      `SELECT id, name, category_id, code 
       FROM classes 
       ORDER BY id ASC`
    ).all();

    // 결과가 없을 경우 빈 배열 반환
    return new Response(JSON.stringify(results || []), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("❌ DB Fetch Error:", err);
    return new Response(JSON.stringify({ error: "Failed to load classes" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
