import { getDB } from "../_db";

const jsonResponse = ({ success, data, status = 200, count }) => {
  const resolvedCount =
    typeof count === "number"
      ? count
      : Array.isArray(data)
      ? data.length
      : data != null
      ? 1
      : 0;

  return new Response(JSON.stringify({ success, count: resolvedCount, data }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};

const handleError = (error, status = 500) =>
  jsonResponse({
    success: false,
    data: {
      message: error instanceof Error ? error.message : String(error),
    },
    status,
    count: 0,
  });

const toBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    return ["1", "true", "yes"].includes(lower);
  }

  return false;
};

export async function onRequest(context) {
  if (context.request.method.toUpperCase() !== "GET") {
    return jsonResponse({
      success: false,
      data: { message: "허용되지 않은 메서드입니다." },
      status: 405,
      count: 0,
    });
  }
  try {
    const DB = getDB(context.env);
    const url = new URL(context.request.url);
    const classId = url.searchParams.get("class_id") ?? url.searchParams.get("classId");
    const role = url.searchParams.get("role");
    const isAdminParam =
      url.searchParams.get("is_admin") ?? url.searchParams.get("isAdmin");

    const isAdmin =
      (typeof role === "string" && role.toLowerCase() === "admin") ||
      toBoolean(isAdminParam);

    let statement;

    if (isAdmin) {
      statement = DB.prepare(
        "SELECT id, class_id, student_name, file_url, feedback, created_at FROM submissions ORDER BY created_at DESC"
      );
    } else {
      if (!classId) {
        return jsonResponse({
          success: false,
          data: { message: "class_id is required for student submission queries." },
          status: 400,
          count: 0,
        });
      }

      statement = DB.prepare(
        "SELECT id, class_id, student_name, file_url, feedback, created_at FROM submissions WHERE class_id = ?1 ORDER BY created_at DESC"
      ).bind(classId);
    }

    const { results } = await statement.all();
    const rows = Array.isArray(results) ? results : [];

    return jsonResponse({ success: true, data: rows });
  } catch (error) {
    return handleError(error);
  }
}
