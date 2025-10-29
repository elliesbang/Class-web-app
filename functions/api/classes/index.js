import { ensureDb, handleError, jsonResponse } from './utils';

export async function onRequest({ request, env }) {
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  try {
    const db = ensureDb(env);
    const { results } = await db
      .prepare(
        `SELECT id, name, category_id, start_date, end_date, upload_limit,
                upload_day, code, created_at, category, duration
         FROM classes
         ORDER BY id DESC`
      )
      .all();

    return jsonResponse(results ?? []);
  } catch (error) {
    return handleError(error);
  }
}
