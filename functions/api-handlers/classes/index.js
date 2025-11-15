import { getDB } from '../../_db.js';

const jsonResponse = (payload, status = 200) =>
  Response.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });

const getDatabase = (env) => {
  const db = getDB(env);

  if (!db || typeof db.prepare !== 'function') {
    throw new Error('D1 Database binding(DB)이 유효하지 않습니다.');
  }

  return db;
};

const ensureClassesTable = async (db) => {
  await db
    .prepare(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_name TEXT NOT NULL,
        category TEXT NOT NULL,
        max_students INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      )
    `)
    .run();
};

const normaliseString = (value) => {
  if (value == null) {
    return '';
  }

  const stringValue = String(value).trim();
  return stringValue;
};

const parseMaxStudents = (value) => {
  const stringValue = normaliseString(value);

  if (stringValue === '') {
    return null;
  }

  const numeric = Number(stringValue);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return Math.trunc(numeric);
};

const toInteger = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (value == null) {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : null;
};

const mapClassRow = (row = {}) => ({
  id: toInteger(row.id),
  class_name: normaliseString(row.class_name),
  category: normaliseString(row.category),
  max_students: toInteger(row.max_students),
  start_date: normaliseString(row.start_date),
  created_at: normaliseString(row.created_at),
});

const handleError = (error) => {
  const message =
    error instanceof Error && error.message
      ? error.message
      : '요청을 처리하는 중 오류가 발생했습니다.';

  return jsonResponse({ success: false, message }, 500);
};

export async function onRequestGet(context) {
  try {
    const db = getDatabase(context.env);
    await ensureClassesTable(db);

    const { results } = await db
      .prepare(`
        SELECT id, class_name, category, max_students, start_date, created_at
        FROM classes
        ORDER BY id DESC
      `)
      .all();

    const rows = Array.isArray(results) ? results : [];

    return jsonResponse({
      success: true,
      message: '수업 목록을 불러왔습니다.',
      data: rows.map(mapClassRow),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function onRequestPost(context) {
  let body;

  try {
    body = await context.request.json();
  } catch {
    return jsonResponse(
      {
        success: false,
        message: 'JSON 형식의 본문이 필요합니다.',
      },
      500,
    );
  }

  try {
    const db = getDatabase(context.env);
    await ensureClassesTable(db);

    const className = normaliseString(body?.['이름']);
    const category = normaliseString(body?.['종류']);
    const startDate = normaliseString(body?.['날짜']);
    const maxStudents = parseMaxStudents(body?.['모집인원']);

    if (!className || !category || !startDate || maxStudents == null) {
      return jsonResponse(
        {
          success: false,
          message: '이름, 모집인원, 종류, 날짜는 모두 필수입니다.',
        },
        500,
      );
    }

    const result = await db
      .prepare(
        `
          INSERT INTO classes (class_name, category, max_students, start_date)
          VALUES (?1, ?2, ?3, ?4)
        `,
      )
      .bind(className, category, maxStudents, startDate)
      .run();

    const insertedId = toInteger(result?.meta?.last_row_id);
    const record =
      insertedId != null
        ? await db
            .prepare(
              `
                SELECT id, class_name, category, max_students, start_date, created_at
                FROM classes
                WHERE id = ?1
              `,
            )
            .bind(insertedId)
            .first()
        : null;

    return jsonResponse(
      {
        success: true,
        message: '수업을 등록했습니다.',
        data: record ? mapClassRow(record) : null,
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
