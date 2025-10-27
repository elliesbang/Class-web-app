import { rowsToCamelCase } from "../../_utils/index.js";

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
      "SELECT id, title, url, description, class_id, display_order, created_at FROM videos";
    const orderBy = " ORDER BY created_at DESC";

    const statement = DB.prepare(
      classId == null ? `${baseQuery}${orderBy}` : `${baseQuery} WHERE class_id = ?${orderBy}`
    );

    const result =
      classId == null ? await statement.all() : await statement.bind(classId).all();

    const rows = rowsToCamelCase(result?.results ?? []);

    return jsonResponse({ success: true, items: rows, videos: rows });
  } catch (error) {
    return errorResponse(error);
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
