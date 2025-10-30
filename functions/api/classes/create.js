const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export async function onRequest(context) {
  const { request } = context;
  if (request.method.toUpperCase() !== "POST") {
    return new Response(
      JSON.stringify({ success: false, message: "허용되지 않은 메서드입니다." }),
      {
        status: 405,
        headers: JSON_HEADERS,
      },
    );
  }
  let payload;

  try {
    payload = await request.json();
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: "유효한 JSON 본문이 필요합니다." }),
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }

  const {
    name,
    category_id,
    start_date = null,
    end_date = null,
    upload_limit = null,
    upload_day = null,
    code = null,
    category = null,
    duration = null,
  } = payload ?? {};

  if (!name || category_id === undefined || category_id === null) {
    return new Response(
      JSON.stringify({ success: false, message: "필수 입력값이 누락되었습니다." }),
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }

  try {
    const db = context.env.DB;
    const result = await db.prepare(`
      INSERT INTO classes (
        name, category_id, start_date, end_date, upload_limit,
        upload_day, code, category, duration, created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, datetime('now','localtime'))
    `)
      .bind(
        name,
        Number(category_id),
        start_date,
        end_date,
        upload_limit,
        upload_day,
        code,
        category,
        duration
      )
      .run();

    const insertedId = result.meta?.last_row_id ?? null;

    return new Response(
      JSON.stringify({
        success: true,
        message: "새 수업이 성공적으로 추가되었습니다.",
        data: { id: insertedId },
      }),
      {
        status: 201,
        headers: JSON_HEADERS,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: JSON_HEADERS,
      }
    );
  }
}
