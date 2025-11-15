// 🔄 Force Cloudflare Functions redeploy - ${new Date().toISOString()}
import { rowsToCamelCase } from "../../_utils/index.js";
import { getDB } from "../_db";

/**
 * 📝 Assignments API - 수업별 과제 등록 / 조회
 * Cloudflare Pages + D1 Database
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

    const baseQuery = "SELECT * FROM assignments";
    const orderBy = " ORDER BY created_at DESC";

    const statement =
      classId == null
        ? DB.prepare(`${baseQuery}${orderBy}`)
        : DB.prepare(`${baseQuery} WHERE class_id = ?${orderBy}`).bind(classId);

    const result = await statement.all();
    const rows = rowsToCamelCase(result?.results ?? []);

    return jsonResponse({ success: true, items: rows, assignments: rows });
  } catch (error) {
    return errorResponse(error);
  }
};

export const onRequestPost = async (context) => {
  try {
    const DB = getDB(context.env);
    const body = await context.request.json();

    const { title, description, due_date, file_url, class_id } = body;

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
      INSERT INTO assignments (title, description, due_date, file_url, class_id, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
      .bind(title, description ?? null, due_date ?? null, file_url ?? null, class_id)
      .run();

    return new Response(
      JSON.stringify({
        status: "success",
        message: "과제가 성공적으로 등록되었습니다.",
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
