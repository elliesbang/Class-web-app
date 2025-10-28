// 🔄 Force Cloudflare Functions redeploy - ${new Date().toISOString()}
/**
 * 📤 Submissions API - 학생 과제 제출 / 조회
 * Cloudflare Pages + D1 Database
 */

export const onRequestGet = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const class_id = url.searchParams.get("class_id");

    let query = "SELECT * FROM submissions";
    let results;

    if (class_id) {
      query += " WHERE class_id = ? ORDER BY submitted_at DESC";
      results = await DB.prepare(query).bind(class_id).all();
    } else {
      query += " ORDER BY submitted_at DESC";
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

    const { student_name, file_url, comment, class_id } = body;

    if (!student_name || !file_url || !class_id) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "필수 항목(student_name, file_url, class_id)이 누락되었습니다.",
        }),
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    await DB.prepare(`
      INSERT INTO submissions (student_name, file_url, comment, class_id)
      VALUES (?, ?, ?, ?)
    `)
      .bind(student_name, file_url, comment ?? null, class_id)
      .run();

    return new Response(
      JSON.stringify({
        status: "success",
        message: "과제가 성공적으로 제출되었습니다.",
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
