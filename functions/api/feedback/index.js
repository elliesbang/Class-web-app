// 🔄 Force Cloudflare Functions redeploy - ${new Date().toISOString()}
/**
 * 💬 Feedback API - 수업별 과제 피드백 등록 / 조회
 */
export const onRequestGet = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const class_id = url.searchParams.get("class_id");

    let query = "SELECT * FROM feedback";
    let results;

    if (class_id) {
      query += " WHERE class_id = ? ORDER BY created_at DESC";
      results = await DB.prepare(query).bind(class_id).all();
    } else {
      query += " ORDER BY created_at DESC";
      results = await DB.prepare(query).all();
    }

    return Response.json(results, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ status: "error", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
};

export const onRequestPost = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json();

    const { content, writer, class_id } = body;

    if (!content || !class_id) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "필수 항목(content, class_id)이 누락되었습니다.",
        }),
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    await DB.prepare(`
      INSERT INTO feedback (content, writer, class_id, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `)
      .bind(content, writer ?? "관리자", class_id)
      .run();

    return new Response(
      JSON.stringify({
        status: "success",
        message: "피드백이 성공적으로 등록되었습니다.",
      }),
      { status: 201, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ status: "error", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
};
   
