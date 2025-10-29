import { ensureDb, handleError, jsonResponse, normaliseClassPayload, parseId } from './utils';

export async function onRequestPut({ request, env }) {
  try {
    const db = ensureDb(env);
    const body = await request.json().catch(() => ({}));
    const classId = parseId(body.id ?? body.class_id ?? body.classId);

    if (!classId) {
      const error = new Error('A valid "id" is required to update a class.');
      error.status = 400;
      throw error;
    }

    const payload = normaliseClassPayload(body);

    if (!payload.name) {
      const error = new Error('The "name" field is required.');
      error.status = 400;
      throw error;
    }

    const statement = db.prepare(`
      UPDATE classes
      SET
        name = ?1,
        category_id = ?2,
        start_date = ?3,
        end_date = ?4,
        upload_limit = ?5,
        upload_day = ?6,
        code = ?7,
        category = ?8,
        duration = ?9
      WHERE id = ?10
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
        classId,
      )
      .run();

    if (!result?.success || result.meta?.changes === 0) {
      const error = new Error(`Class with id ${classId} was not found.`);
      error.status = 404;
      throw error;
    }

    return jsonResponse({
      success: true,
      data: {
        id: classId,
        changes: result.meta?.changes ?? 0,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
