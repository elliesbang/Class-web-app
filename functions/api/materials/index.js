/**
 * 📚 Materials API - 수업 자료 업로드 / 조회
 */
export const onRequestGet = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const class_id = url.searchParams.get("class_id");

    let query = "SELECT * FROM materials";
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

    const { title, file_url, class_id } = body;

    if (!title || !file_url || !class_id) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "필수 항목(title, file_url, class_id)이 누락되었습니다.",
        }),
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    await DB.prepare(`
      INSERT INTO materials (title, file_url, class_id, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `)
      .bind(title, file_url, class_id)
      .run();

    return new Response(
      JSON.stringify({
        status: "success",
        message: "자료가 성공적으로 업로드되었습니다.",
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
