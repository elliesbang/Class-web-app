import { getDB } from '../utils/db';

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

const handleErrorResponse = (error) => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return jsonResponse({ success: false, error: message }, 500);
};

const normaliseUserId = (request) => {
  const headerValue = request.headers.get('x-user-id') ?? request.headers.get('X-User-Id');
  if (typeof headerValue === 'string' && headerValue.trim().length > 0) {
    return headerValue.trim();
  }
  return 'guest';
};

const ensureNotificationsTable = async (db) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);
};

const getValidDatabase = (env) => {
  const db = getDB(env);
  if (!db || typeof db.prepare !== 'function') {
    throw new Error('D1 Database binding(DB)이 유효하지 않습니다.');
  }
  return db;
};

const fetchNotifications = async (db, userId) => {
  const { results } = await db
    .prepare(
      `SELECT id, title, message, created_at
       FROM notifications
       WHERE user_id = ?1
       ORDER BY datetime(created_at) DESC, id DESC`,
    )
    .bind(userId)
    .all();

  const rows = Array.isArray(results) ? results : [];
  return rows.map((row) => ({
    id: typeof row.id === 'number' ? row.id : Number(row.id) || 0,
    title: typeof row.title === 'string' ? row.title : String(row.title ?? ''),
    message: typeof row.message === 'string' ? row.message : String(row.message ?? ''),
    createdAt:
      typeof row.created_at === 'string'
        ? row.created_at
        : typeof row.createdAt === 'string'
        ? row.createdAt
        : new Date().toISOString(),
  }));
};

export async function onRequest(context) {
  try {
    const db = getValidDatabase(context.env);
    await ensureNotificationsTable(db);

    if (context.request.method !== 'GET') {
      return jsonResponse({ success: false, message: '허용되지 않은 요청입니다.' }, 405);
    }

    const userId = normaliseUserId(context.request);
    const notifications = await fetchNotifications(db, userId);

    return jsonResponse({ success: true, data: notifications });
  } catch (error) {
    return handleErrorResponse(error);
  }
}

export const onRequestGet = onRequest;
