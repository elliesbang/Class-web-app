import { ensureDb, jsonResponse, handleError } from './utils';

export const onRequestPut = async ({ request, env }) => {
  try {
    const db = await ensureDb(env);
    const body = await request.json();
    const {
      id,
      name,
      category_id,
      start_date,
      end_date,
      upload_limit,
      upload_day,
      code,
      category,
      duration
    } = body;

    const query = `
      UPDATE classes
      SET name = ?, category_id = ?, start_date = ?, end_date = ?,
          upload_limit = ?, upload_day = ?, code = ?, category = ?, duration = ?
      WHERE id = ?
    `;

    await db.prepare(query).bind(
      name,
      category_id,
      start_date,
      end_date,
      upload_limit,
      upload_day,
      code,
      category,
      duration,
      id
    ).run();

    return jsonResponse({ success: true, message: 'Class updated successfully' });
  } catch (err) {
    return handleError(err);
  }
};
