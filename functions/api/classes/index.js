/**
 * 🎯 Classes API - 수업 목록 조회 + 카테고리명 JOIN 포함
 * Cloudflare Pages + D1 Database
 */

export const onRequestGet = async (context) => {
  try {
    const { DB } = context.env;

    // ✅ JOIN으로 카테고리명까지 가져오기
    const { results } = await DB.prepare(`
      SELECT 
        c.id,
        c.name AS class_name,
        cat.name AS category_name,
        c.code,
        c.upload_limit,
        c.upload_day,
        c.created_at
      FROM classes c
      LEFT JOIN categories cat ON c.category_id = cat.id
      ORDER BY c.created_at DESC
    `).all();

    return Response.json(results, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error) {
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
