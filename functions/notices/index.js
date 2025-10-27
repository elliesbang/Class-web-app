import { rowsToCamelCase } from "../_utils/index.js";

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

const errorResponse = (error) =>
  new Response(
    JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : String(error),
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    }
  );

const normaliseClassId = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const onRequestGet = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const classIdRaw =
      url.searchParams.get("classId") ?? url.searchParams.get("class_id");
    const classId = normaliseClassId(classIdRaw);

    const baseQuery =
      "SELECT id, title, content, author, class_id, created_at FROM notices";
    const orderBy = " ORDER BY created_at DESC";
    const statement = DB.prepare(
      classId == null ? `${baseQuery}${orderBy}` : `${baseQuery} WHERE class_id = ?${orderBy}`
    );
    const result =
      classId == null ? await statement.all() : await statement.bind(classId).all();

    const rows = rowsToCamelCase(result?.results ?? []);

    return jsonResponse({ success: true, items: rows, notices: rows });
  } catch (error) {
    return errorResponse(error);
  }
};

export const onRequestPost = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json();

    const { title, content, class_id } = body;

    if (!title || !class_id) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "필수 항목(title, class_id)이 누락되었습니다.",
        }),
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    await DB.prepare(`
      INSERT INTO notices (title, content, class_id, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `)
      .bind(title, content ?? null, class_id)
      .run();

    return new Response(
      JSON.stringify({
        status: "success",
        message: "공지사항이 성공적으로 등록되었습니다.",
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
