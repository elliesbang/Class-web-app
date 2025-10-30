import { getDB } from "../_db";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};

const CLASS_COLUMNS = `
  id,
  name,
  category_id,
  start_date,
  end_date,
  upload_limit,
  upload_day,
  code,
  category,
  duration,
  created_at
`;

const toNullableString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const stringValue = String(value).trim();
  return stringValue.length === 0 ? null : stringValue;
};

const toNullableInteger = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw new Error(`${fieldName} 값이 올바르지 않습니다.`);
  }

  return parsed;
};

const parseRequestBody = async (request) => {
  try {
    return await request.json();
  } catch (error) {
    throw new Error("JSON 형식의 요청 본문이 필요합니다.");
  }
};

const jsonResponse = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: JSON_HEADERS,
  });

const handleGet = async (context) => {
  try {
    const DB = getDB(context.env);
    const statement = DB.prepare(`
      SELECT ${CLASS_COLUMNS}
        FROM classes
    ORDER BY created_at DESC
    `);

    const { results } = await statement.all();

    return jsonResponse({ success: true, data: results ?? [] }, { status: 200 });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, { status: 500 });
  }
};

const handlePost = async (context) => {
  try {
    const DB = getDB(context.env);
    const body = await parseRequestBody(context.request);

    const name = toNullableString(body?.name);
    if (!name) {
      return jsonResponse(
        { success: false, error: "수업명을 입력하세요." },
        { status: 400 },
      );
    }

    let categoryId;
    try {
      categoryId = toNullableInteger(body?.category_id, "category_id");
    } catch (error) {
      return jsonResponse({ success: false, error: error.message }, { status: 400 });
    }

    const startDate = toNullableString(body?.start_date);
    const endDate = toNullableString(body?.end_date);
    const uploadLimit = toNullableString(body?.upload_limit);
    const uploadDay = toNullableString(body?.upload_day);
    const code = toNullableString(body?.code);
    const category = toNullableString(body?.category);
    const duration = toNullableString(body?.duration);

    await DB.prepare(`
      INSERT INTO classes (
        name,
        category_id,
        start_date,
        end_date,
        upload_limit,
        upload_day,
        code,
        category,
        duration
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
    `)
      .bind(
        name,
        categoryId,
        startDate,
        endDate,
        uploadLimit,
        uploadDay,
        code,
        category,
        duration,
      )
      .run();

    const inserted = await DB.prepare(`
      SELECT ${CLASS_COLUMNS}
        FROM classes
       WHERE id = last_insert_rowid()
    `).first();

    return jsonResponse(
      {
        success: true,
        message: "새 수업이 추가되었습니다.",
        data: inserted ?? null,
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, { status: 500 });
  }
};

export async function onRequest(context) {
  const method = context.request.method.toUpperCase();

  if (method === "GET") {
    return handleGet(context);
  }

  if (method === "POST") {
    return handlePost(context);
  }

  return jsonResponse(
    { success: false, error: "허용되지 않은 메서드입니다." },
    { status: 405 },
  );
}
