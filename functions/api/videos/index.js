/**
 * 🎥 Videos API - 수업별 영상 업로드 / 조회
 * Cloudflare Pages + D1 Database
 */

export const onRequestGet = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const class_id = url.searchParams.get("class_id");

    let query = "SELECT * FROM videos";
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

    const { title, video_url, class_id, thumbnail_url } = body;

    if (!title || !video_url || !class_id) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "필수 항목(title, video_url, class_id)이 누락되었습니다.",
        }),
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    await DB.prepare(`
      INSERT INTO videos (title, video_url, thumbnail_url, class_id, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
      .bind(title, video_url, thumbnail_url ?? null, class_id)
      .run();

    return new Response(
      JSON.stringify({
        status: "success",
        message: "영상이 성공적으로 업로드되었습니다.",
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
