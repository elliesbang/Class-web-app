// 🔄 Force Cloudflare Functions redeploy - ${new Date().toISOString()}
import { rowsToCamelCase } from "../../_utils/index.js";
import { getDB } from "../_db";

/**
 * 💬 Feedback API - 수업별 과제 피드백 등록 / 조회
 */
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
    { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } },
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
    const DB = getDB(context.env);
    const url = new URL(context.request.url);
    const classIdRaw =
      url.searchParams.get("classId") ?? url.searchParams.get("class_id");
    const classId = normaliseClassId(classIdRaw);

    const baseQuery = "SELECT * FROM feedback";
    const orderBy = " ORDER BY created_at DESC";

    const statement =
      classId == null
        ? DB.prepare(`${baseQuery}${orderBy}`)
        : DB.prepare(`${baseQuery} WHERE class_id = ?${orderBy}`).bind(classId);

    const result = await statement.all();
    const rows = rowsToCamelCase(result?.results ?? []);

    return jsonResponse({ success: true, items: rows, feedback: rows });
  } catch (error) {
    return errorResponse(error);
  }
};

export const onRequestPost = async (context) => {
  try {
    const DB = getDB(context.env);
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
   
