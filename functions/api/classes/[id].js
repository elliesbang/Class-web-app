import { getDB } from '../utils/db';

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

  return String(value).trim();
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

const notFound = (message = '요청하신 수업을 찾을 수 없습니다.') =>
  jsonResponse({ success: false, message }, 404);

const getClassIdFromParams = (params = {}) => {
  const value = params.id ?? params.ID ?? params.Id;
  const numeric = Number(value);

  return Number.isFinite(numeric) ? Math.trunc(numeric) : null;
};

const fetchClassById = async (db, id) => {
  const record = await db
    .prepare(
      `
        SELECT id, class_name, category, max_students, start_date, created_at
        FROM classes
        WHERE id = ?1
      `,
    )
    .bind(id)
    .first();

  return record ? mapClassRow(record) : null;
};

const extractPayload = (body = {}) => {
  const className = normaliseString(body?.['이름']);
  const category = normaliseString(body?.['종류']);
  const startDate = normaliseString(body?.['날짜']);
  const maxStudents = parseMaxStudents(body?.['모집인원']);

  if (!className || !category || !startDate || maxStudents == null) {
    return null;
  }

  return { className, category, startDate, maxStudents };
};

export async function onRequestGet(context) {
  try {
    const db = getDatabase(context.env);
    await ensureClassesTable(db);

    const id = getClassIdFromParams(context.params);

    if (id == null) {
      return notFound('유효한 수업 ID가 필요합니다.');
    }

    const record = await fetchClassById(db, id);

    if (!record) {
      return notFound();
    }

    return jsonResponse({
      success: true,
      message: '수업 정보를 불러왔습니다.',
      data: record,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function onRequestPut(context) {
  let body;

  try {
    body = await context.request.json();
  } catch {
    return jsonResponse(
      { success: false, message: 'JSON 형식의 본문이 필요합니다.' },
      500,
    );
  }

  try {
    const db = getDatabase(context.env);
    await ensureClassesTable(db);

    const id = getClassIdFromParams(context.params);

    if (id == null) {
      return notFound('유효한 수업 ID가 필요합니다.');
    }

    const payload = extractPayload(body);

    if (!payload) {
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
          UPDATE classes
          SET class_name = ?1, category = ?2, max_students = ?3, start_date = ?4
          WHERE id = ?5
        `,
      )
      .bind(
        payload.className,
        payload.category,
        payload.maxStudents,
        payload.startDate,
        id,
      )
      .run();

    if (!result?.meta || result.meta.changes === 0) {
      return notFound();
    }

    const record = await fetchClassById(db, id);

    return jsonResponse({
      success: true,
      message: '수업 정보를 수정했습니다.',
      data: record,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function onRequestDelete(context) {
  try {
    const db = getDatabase(context.env);
    await ensureClassesTable(db);

    const id = getClassIdFromParams(context.params);

    if (id == null) {
      return notFound('유효한 수업 ID가 필요합니다.');
    }

    const result = await db
      .prepare(
        `
          DELETE FROM classes
          WHERE id = ?1
        `,
      )
      .bind(id)
      .run();

    if (!result?.meta || result.meta.changes === 0) {
      return notFound();
    }

    return jsonResponse({
      success: true,
      message: '수업을 삭제했습니다.',
      data: { id },
    });
  } catch (error) {
    return handleError(error);
  }
}
