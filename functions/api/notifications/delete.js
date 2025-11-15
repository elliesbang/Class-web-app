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

const parseNotificationId = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : 0;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return 0;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
  }
  return 0;
};

export async function onRequest(context) {
  try {
    if (context.request.method !== 'POST') {
      return jsonResponse({ success: false, message: '허용되지 않은 요청입니다.' }, 405);
    }

    const db = getValidDatabase(context.env);
    await ensureNotificationsTable(db);

    let payload = {};
    try {
      payload = await context.request.json();
    } catch (error) {
      console.warn('[notifications/delete] invalid JSON payload', error);
    }

    const notificationId = parseNotificationId(payload?.id);
    if (!notificationId) {
      return jsonResponse({ success: false, message: '유효한 알림 ID가 필요합니다.' }, 400);
    }

    const userId = normaliseUserId(context.request);
    const result = await db
      .prepare('DELETE FROM notifications WHERE id = ?1 AND user_id = ?2')
      .bind(notificationId, userId)
      .run();

    const changesRaw = result?.meta?.changes;
    const deletedCount =
      typeof changesRaw === 'number' ? changesRaw : Number(changesRaw ?? 0) || 0;

    if (deletedCount === 0) {
      return jsonResponse({ success: false, message: '삭제할 알림을 찾을 수 없습니다.' }, 404);
    }

    return jsonResponse({ success: true, deleted: deletedCount });
  } catch (error) {
    return handleErrorResponse(error);
  }
}

export const onRequestPost = onRequest;
