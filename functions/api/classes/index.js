/**
 * 🎯 Classes API - 목록 조회 / 추가 / 삭제 통합 버전
 */

export const onRequestGet = async (context) => {
  try {
    const { DB } = context.env;
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
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
};

/**
 * 🆕 새 수업 등록 (POST)
 * 프론트에서 fetch('/api/classes', { method: 'POST', body: JSON.stringify({...}) })
 */
export const onRequestPost = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json();

    const { name, category_id, code, upload_limit, upload_day } = body;

    if (!name || !category_id) {
      return new Response(
        JSON.stringify({ status: "error", message: "필수 항목이 누락되었습니다." }),
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    await DB.prepare(`
      INSERT INTO classes (name, category_id, code, upload_limit, upload_day, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
      .bind(name, category_id, code ?? null, upload_limit ?? null, upload_day ?? null)
      .run();

    return new Response(
      JSON.stringify({ status: "success", message: "수업이 성공적으로 추가되었습니다." }),
      { status: 201, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
};

/**
 * 🗑️ 수업 삭제 (DELETE)
 * 프론트에서 fetch('/api/classes?id=3', { method: 'DELETE' }) 형태로 호출
 */
export const onRequestDelete = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ status: "error", message: "수업 ID가 없습니다." }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    await DB.prepare("DELETE FROM classes WHERE id = ?").bind(id).run();

    return new Response(
      JSON.stringify({ status: "success", message: `수업 ${id} 삭제 완료` }),
      { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ status: "error", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
};
