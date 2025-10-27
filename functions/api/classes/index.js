/**
 * 🎯 Classes API - 수업 목록 조회
 * Cloudflare Pages + D1 Database 버전
 */

export const onRequestGet = async (context) => {
  try {
    const { DB } = context.env;

    // ✅ 실제 classes 테이블 데이터 조회
    const { results } = await DB.prepare(`
      SELECT 
        id, 
        class_name, 
        category_id, 
        class_type, 
        upload_limit, 
        created_at
      FROM classes
      ORDER BY created_at DESC
    `).all();

    // ✅ 정상 응답
    return Response.json(results, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    // ❌ 오류 응답
    return new Response(
      JSON.stringify({
        status: "error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }
};
