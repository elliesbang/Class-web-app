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

const jsonResponse = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: JSON_HEADERS,
  });

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

const parseClassId = (rawId) => {
  const id = Number(rawId);

  if (!rawId || Number.isNaN(id) || !Number.isInteger(id) || id <= 0) {
    throw new Error("유효한 수업 ID가 필요합니다.");
  }

  return id;
};

export async function onRequestGet(context) {
  let id;

  try {
    id = parseClassId(context.params?.id);
  } catch (error) {
    return jsonResponse({ success: false, message: error.message }, { status: 400 });
  }

  try {
    const DB = getDB(context.env);

    const classData = await DB.prepare(`
      SELECT ${CLASS_COLUMNS}
        FROM classes
       WHERE id = ?1
    `)
      .bind(id)
      .first();

    if (!classData) {
      return jsonResponse(
        { success: false, message: "해당 수업을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return jsonResponse({ success: true, data: classData }, { status: 200 });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  let id;

  try {
    id = parseClassId(context.params?.id);
  } catch (error) {
    return jsonResponse({ success: false, message: error.message }, { status: 400 });
  }

  try {
    const DB = getDB(context.env);

    const exists = await DB.prepare(`
      SELECT id
        FROM classes
       WHERE id = ?1
    `)
      .bind(id)
      .first();

    if (!exists) {
      return jsonResponse(
        { success: false, message: "해당 수업을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

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
        categoryId,
        startDate,
        endDate,
        uploadLimit,
        uploadDay,
        code,
        category,
        duration,
        id,
      )
      .run();

    const updated = await DB.prepare(`
      SELECT ${CLASS_COLUMNS}
        FROM classes
       WHERE id = ?1
    `)
      .bind(id)
      .first();

    return jsonResponse(
      {
        success: true,
        message: "수업 정보가 수정되었습니다.",
        data: updated ?? null,
      },
      { status: 200 },
    );
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  let id;

  try {
    id = parseClassId(context.params?.id);
  } catch (error) {
    return jsonResponse({ success: false, message: error.message }, { status: 400 });
  }

  try {
    const DB = getDB(context.env);

    const exists = await DB.prepare(`
      SELECT id
        FROM classes
       WHERE id = ?1
    `)
      .bind(id)
      .first();

    if (!exists) {
      return jsonResponse(
        { success: false, message: "해당 수업을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    await DB.prepare(`
      DELETE FROM classes
       WHERE id = ?1
    `)
      .bind(id)
      .run();

    return jsonResponse(
      { success: true, message: "수업이 삭제되었습니다." },
      { status: 200 },
    );
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, { status: 500 });
  }
}
