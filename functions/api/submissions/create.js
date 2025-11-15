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

export const onRequestPost = async (context) => {
  try {
    const DB = getDB(context.env);
    const body = await context.request.json();

    const classId = body.class_id ?? body.classId;
    const studentName = body.student_name ?? body.studentName;
    const fileUrl = body.file_url ?? body.fileUrl;

    if (!classId || !studentName || !fileUrl) {
      return jsonResponse({
        success: false,
        data: {
          message:
            "class_id, student_name, and file_url are required to create a submission.",
        },
        status: 400,
        count: 0,
      });
    }

    const insertStatement = DB.prepare(
      `INSERT INTO submissions (class_id, student_name, file_url, created_at) VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP)`
    ).bind(classId, studentName, fileUrl);

    const insertResult = await insertStatement.run();
    const insertedId = insertResult?.meta?.last_row_id ?? null;

    if (!insertedId) {
      return jsonResponse({
        success: true,
        data: { class_id: classId, student_name: studentName, file_url: fileUrl },
        status: 201,
      });
    }

    const { results } = await DB.prepare(
      `SELECT id, class_id, student_name, file_url, feedback, created_at FROM submissions WHERE id = ?1`
    )
      .bind(insertedId)
      .all();

    const record = Array.isArray(results) && results.length > 0 ? results[0] : null;

    return jsonResponse({
      success: true,
      data:
        record ?? {
          id: insertedId,
          class_id: classId,
          student_name: studentName,
          file_url: fileUrl,
          feedback: null,
        },
      status: 201,
    });
  } catch (error) {
    return handleError(error);
  }
};
