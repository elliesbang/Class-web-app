import { getDB } from "../utils/db";

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

export const onRequestPut = async (context) => {
  try {
    const DB = getDB(context.env);
    const body = await context.request.json();

    const id = body.id;
    const feedback = body.feedback ?? null;

    if (!id) {
      return jsonResponse({
        success: false,
        data: { message: "id is required to update feedback." },
        status: 400,
        count: 0,
      });
    }

    const updateStatement = DB.prepare(
      `UPDATE submissions SET feedback = ?1 WHERE id = ?2`
    ).bind(feedback, id);

    const updateResult = await updateStatement.run();
    const updatedRows = updateResult?.meta?.changes ?? 0;

    if (updatedRows === 0) {
      return jsonResponse({
        success: false,
        data: { message: "No submission found for the provided id." },
        status: 404,
        count: 0,
      });
    }

    const { results } = await DB.prepare(
      `SELECT id, class_id, student_name, file_url, feedback, created_at FROM submissions WHERE id = ?1`
    )
      .bind(id)
      .all();

    const record = Array.isArray(results) && results.length > 0 ? results[0] : null;

    return jsonResponse({
      success: true,
      data: record ?? { id, feedback },
      status: 200,
      count: updatedRows,
    });
  } catch (error) {
    return handleError(error);
  }
};
