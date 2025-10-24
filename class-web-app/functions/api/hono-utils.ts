import type { Context } from 'hono';

export type AppBindings = {
  DB: D1Database;
};

export type AppEnv = {
  Bindings: AppBindings;
};

export type ClassRow = {
  id: number;
};

const ensureClassesTable = async (db: D1Database) => {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      )`
    )
    .bind()
    .run();
};

const ensureVideosTable = async (db: D1Database) => {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        class_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )`
    )
    .bind()
    .run();
};

const ensureNoticesTable = async (db: D1Database) => {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        class_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )`
    )
    .bind()
    .run();
};

const ensureFeedbackTable = async (db: D1Database) => {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT NOT NULL,
        comment TEXT NOT NULL,
        class_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )`
    )
    .bind()
    .run();
};

export const ensureBaseSchema = async (db: D1Database) => {
  await ensureClassesTable(db);
  await Promise.all([ensureVideosTable(db), ensureNoticesTable(db), ensureFeedbackTable(db)]);
};

export const successResponse = <T>(
  c: Context<AppEnv>,
  data: T,
  message: string,
  status = 200,
) => c.json({ success: true, data, message }, status);

export const errorResponse = (
  c: Context<AppEnv>,
  message: string,
  status = 500,
) => c.json({ success: false, message }, status);

export const assertClassExists = async (db: D1Database, classId: number) => {
  const classRow = await db.prepare('SELECT id FROM classes WHERE id = ?1').bind(classId).first<ClassRow>();
  return Boolean(classRow?.id);
};

export const parseNumericQuery = (value: string | null) => {
  if (value === null) {
    return Number.NaN;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
};

export const parseJsonBody = async <T>(c: Context<AppEnv>) => {
  try {
    return (await c.req.json()) as T;
  } catch (error) {
    throw new Error('유효한 JSON 본문이 필요합니다.');
  }
};

export const handleRoute = async (
  c: Context<AppEnv>,
  handler: () => Promise<Response>,
): Promise<Response> => {
  try {
    return await handler();
  } catch (error) {
    const message = error instanceof Error ? error.message : '서버 처리 중 오류가 발생했습니다.';
    console.error('[API ERROR]', message, error);
    return errorResponse(c, message, 500);
  }
};
