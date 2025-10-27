/**
 * 🎯 Classes API - 수업 목록 조회 (최종 확정 버전)
 * Cloudflare Pages + D1 Database
 */

export const onRequestGet = async (context) => {
  try {
    const { DB } = context.env;

    // ✅ 실제 테이블 구조에 맞게 수정
    const { results } = await DB.prepare(`
      SELECT 
        id,
        name,
        category_id,
        start_date,
        end_date,
        upload_limit,
        upload_day,
        code,
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
