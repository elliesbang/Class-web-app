export const DB = 'DB';

const ensureClassesTable = async (db) => {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      )`,
    )
    .bind()
    .run();
};

const ensureVideosTable = async (db) => {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        class_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )`,
    )
    .bind()
    .run();
};

const ensureNoticesTable = async (db) => {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        class_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )`,
    )
    .bind()
    .run();
};

const ensureFeedbackTable = async (db) => {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT NOT NULL,
        comment TEXT NOT NULL,
        class_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )`,
    )
    .bind()
    .run();
};

export const ensureBaseSchema = async (db) => {
  await ensureClassesTable(db);
  await Promise.all([ensureVideosTable(db), ensureNoticesTable(db), ensureFeedbackTable(db)]);
};

export const successResponse = (context, data, message, status = 200) =>
  new Response(JSON.stringify({ success: true, data, message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export const errorResponse = (context, message, status = 500) =>
  new Response(JSON.stringify({ success: false, message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const assertClassExists = async (db, classId) => {
  const classRow = await db.prepare('SELECT id FROM classes WHERE id = ?1').bind(classId).first();
  return Boolean(classRow?.id);
};

export const parseNumericQuery = (value) => {
  if (value === null) {
    return Number.NaN;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
};

export const parseJsonBody = async (context) => {
  try {
    return await context.request.json();
  } catch (error) {
    throw new Error('유효한 JSON 본문이 필요합니다.');
  }
};

export const handleRoute = async (context, handler) => {
  try {
    return await handler();
  } catch (error) {
    const message = error instanceof Error ? error.message : '서버 처리 중 오류가 발생했습니다.';
    // console.debug('[API ERROR]', message, error)
    return errorResponse(context, message, 500);
  }
};

const jsonErrorResponse = (message, status = 500) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const withBindings = (fetcher, requiredBindings) => {
  return async (context) => {
    const { request, env } = context;
    const bindingKeys = Object.values(requiredBindings);

    const missingBindings = bindingKeys.filter((binding) => env[binding] === undefined);
    if (missingBindings.length > 0) {
      const message = `Missing bindings: ${missingBindings.join(', ')}`;
      // console.debug('[Binding Error]', message)
      return jsonErrorResponse(message, 500);
    }

    if (bindingKeys.includes(DB)) {
      const db = env[DB];
      // console.debug('[DB 연결 상태 확인] Binding present:', Boolean(db))
      if (db) {
        const testQuery = async () => {
          try {
            const { results } = await db.prepare('SELECT 1 as ready').all();
            // console.debug('[DB 연결 상태 확인] Test query results:', results)
          } catch (error) {
            // console.debug('[DB 연결 상태 확인] Test query failed', error)
          }
        };

        if (typeof context.waitUntil === 'function') {
          context.waitUntil(testQuery());
        } else {
          await testQuery();
        }
      }
    }

    try {
      return await fetcher(request, env, context);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      // console.debug('[API Handler Error]', error)
      return jsonErrorResponse(message, 500);
    }
  };
};
