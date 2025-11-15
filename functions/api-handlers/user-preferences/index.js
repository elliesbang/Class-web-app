import { getDB } from '../../_db.js';

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

const ensurePreferencesTable = async (db) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users_preferences (
      user_id TEXT NOT NULL,
      preference_key TEXT NOT NULL,
      is_enabled INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      PRIMARY KEY (user_id, preference_key)
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

const PREFERENCE_KEYS = [
  'admin_notice',
  'assignment_deadline',
  'new_course_upload',
  'feedback_received',
  'vod_update',
];

const coerceBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    return normalised === '1' || normalised === 'true' || normalised === 'y' || normalised === 'yes';
  }
  return false;
};

const fetchUserPreferences = async (db, userId) => {
  const { results } = await db
    .prepare(
      `SELECT preference_key, is_enabled
       FROM users_preferences
       WHERE user_id = ?1`,
    )
    .bind(userId)
    .all();

  const rows = Array.isArray(results) ? results : [];
  const preferences = Object.create(null);
  for (const key of PREFERENCE_KEYS) {
    preferences[key] = true;
  }
  for (const row of rows) {
    const key = typeof row.preference_key === 'string' ? row.preference_key : String(row.preference_key ?? '');
    if (!PREFERENCE_KEYS.includes(key)) {
      continue;
    }
    const isEnabled =
      typeof row.is_enabled === 'number'
        ? row.is_enabled !== 0
        : coerceBoolean(row.is_enabled);
    preferences[key] = isEnabled;
  }
  return preferences;
};

const savePreferences = async (db, userId, payload) => {
  const nowPreferences = {};
  for (const key of PREFERENCE_KEYS) {
    nowPreferences[key] = coerceBoolean(payload?.[key]);
  }

  for (const key of PREFERENCE_KEYS) {
    const flag = nowPreferences[key] ? 1 : 0;
    await db
      .prepare(`
        INSERT INTO users_preferences (user_id, preference_key, is_enabled, updated_at)
        VALUES (?1, ?2, ?3, datetime('now', 'localtime'))
        ON CONFLICT(user_id, preference_key) DO UPDATE SET
          is_enabled = excluded.is_enabled,
          updated_at = excluded.updated_at
      `)
      .bind(userId, key, flag)
      .run();
  }

  return nowPreferences;
};

export async function onRequest(context) {
  try {
    const db = getValidDatabase(context.env);
    await ensurePreferencesTable(db);

    const userId = normaliseUserId(context.request);

    if (context.request.method === 'GET') {
      const preferences = await fetchUserPreferences(db, userId);
      return jsonResponse({ success: true, data: preferences });
    }

    if (context.request.method === 'POST') {
      let payload = {};
      try {
        payload = await context.request.json();
      } catch (error) {
        console.warn('[user-preferences] invalid JSON payload', error);
      }

      const preferencesPayload = payload?.preferences ?? payload;
      const saved = await savePreferences(db, userId, preferencesPayload);
      return jsonResponse({ success: true, data: saved, message: '알림 설정이 저장되었습니다.' });
    }

    return jsonResponse({ success: false, message: '허용되지 않은 요청입니다.' }, 405);
  } catch (error) {
    return handleErrorResponse(error);
  }
}

export const onRequestGet = onRequest;
export const onRequestPost = onRequest;
