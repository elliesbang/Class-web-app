/**
 * 🎯 Categories API - 카테고리 목록 조회
 * Cloudflare Pages + D1 Database 버전
 */

export const onRequestGet = async (context) => {
  try {
    const { DB } = context.env;

    // ✅ categories 테이블 전체 조회
    const { results } = await DB.prepare(`
      SELECT 
        id, 
        category_name
      FROM categories
      ORDER BY id ASC
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
