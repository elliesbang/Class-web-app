import { ensureDb, handleError, jsonResponse, normaliseClassPayload } from './utils';

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  try {
    const db = ensureDb(env);
    const data = await request.json().catch(() => ({}));
    const payload = normaliseClassPayload(data);

    const result = await db
      .prepare(
        `INSERT INTO classes (
           name, category_id, start_date, end_date, upload_limit,
           upload_day, code, category, duration
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        payload.name,
        payload.category_id,
        payload.start_date,
        payload.end_date,
        payload.upload_limit,
        payload.upload_day,
        payload.code,
        payload.category,
        payload.duration
      )
      .run();

    return jsonResponse(
      {
        success: true,
        id: result?.meta?.last_row_id ?? null,
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
