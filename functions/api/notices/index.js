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

const normaliseClassId = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
};

const mapNoticeRecord = (row) => ({
  id: row?.id ?? null,
  classId: row?.class_id ?? row?.classId ?? null,
  title: row?.title ?? null,
  content: row?.content ?? null,
  author: row?.author ?? null,
  createdAt: row?.created_at ?? row?.createdAt ?? null,
});

export const onRequestGet = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const classIdParam =
      url.searchParams.get("class_id") ?? url.searchParams.get("classId");
    const classId = normaliseClassId(classIdParam);

    const baseQuery =
      "SELECT id, class_id, title, content, author, created_at FROM notices";
    const orderBy = " ORDER BY created_at DESC";

    const statement =
      classId == null
        ? DB.prepare(`${baseQuery}${orderBy}`)
        : DB.prepare(`${baseQuery} WHERE class_id = ?1${orderBy}`).bind(classId);

    const { results } = await statement.all();
    const rows = Array.isArray(results) ? results.map(mapNoticeRecord) : [];

    return jsonResponse({ success: true, data: rows });
  } catch (error) {
    return handleError(error);
  }
};

export const onRequestPost = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json();

    const title = body.title;
    const classId = body.class_id ?? body.classId;
    const content = body.content ?? null;
    const author = body.author ?? null;

    if (!title || !classId) {
      return jsonResponse({
        success: false,
        data: { message: "title and class_id are required to create a notice." },
        status: 400,
        count: 0,
      });
    }

    const insertStatement = DB.prepare(
      `INSERT INTO notices (class_id, title, content, author, created_at) VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)`
    ).bind(classId, title, content, author);

    const insertResult = await insertStatement.run();
    const insertedId = insertResult?.meta?.last_row_id ?? null;

    if (!insertedId) {
      return jsonResponse({
        success: true,
        data: { id: null, classId, title, content, author },
        status: 201,
      });
    }

    const { results } = await DB.prepare(
      `SELECT id, class_id, title, content, author, created_at FROM notices WHERE id = ?1`
    )
      .bind(insertedId)
      .all();

    const record =
      Array.isArray(results) && results.length > 0
        ? mapNoticeRecord(results[0])
        : mapNoticeRecord({
            id: insertedId,
            class_id: classId,
            title,
            content,
            author,
          });

    return jsonResponse({ success: true, data: record, status: 201 });
  } catch (error) {
    return handleError(error);
  }
};
