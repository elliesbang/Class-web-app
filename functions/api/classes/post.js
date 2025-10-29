import { ensureDb, handleError, jsonResponse, normaliseClassPayload } from './utils';

export async function onRequestPost({ request, env }) {
  try {
    const db = ensureDb(env);
    const body = await request.json().catch(() => ({}));
    const payload = normaliseClassPayload(body);

    if (!payload.name) {
      const error = new Error('The "name" field is required.');
      error.status = 400;
      throw error;
    }

    const statement = db.prepare(`
      INSERT INTO classes (
        name,
        category_id,
        start_date,
        end_date,
        upload_limit,
        upload_day,
        code,
        category,
        duration
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
    `);

    const result = await statement
      .bind(
        payload.name,
        payload.category_id,
        payload.start_date,
        payload.end_date,
        payload.upload_limit,
        payload.upload_day,
        payload.code,
        payload.category,
        payload.duration,
      )
      .run();

    return jsonResponse(
      {
        success: true,
        data: {
          id: result?.meta?.last_row_id ?? null,
        },
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
