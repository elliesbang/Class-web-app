const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export async function onRequest(context) {
  const { request } = context;
  if (request.method.toUpperCase() !== "PUT") {
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
    id,
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

  const numericId = Number(id);

  if (!numericId || !Number.isInteger(numericId) || numericId <= 0) {
    return new Response(
      JSON.stringify({ success: false, message: "수정할 수업 ID가 필요합니다." }),
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }

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
      UPDATE classes
         SET name = ?1,
             category_id = ?2,
             start_date = ?3,
             end_date = ?4,
             upload_limit = ?5,
             upload_day = ?6,
             code = ?7,
             category = ?8,
             duration = ?9
       WHERE id = ?10
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
        duration,
        numericId
      )
      .run();

    if (!result.meta || result.meta.changes === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "해당 수업을 찾을 수 없습니다." }),
        {
          status: 404,
          headers: JSON_HEADERS,
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "수업이 성공적으로 수정되었습니다." }),
      {
        status: 200,
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
