import { ensureDb, handleError, jsonResponse } from './utils';
export { onRequestPost } from './post';
export { onRequestPut } from './put';
export { onRequestDelete } from './delete';

export async function onRequestGet({ env }) {
  try {
    const db = ensureDb(env);
    const query = `
      SELECT
        id,
        name,
        category_id,
        start_date,
        end_date,
        upload_limit,
        upload_day,
        code,
        created_at,
        category,
        duration
      FROM classes
      ORDER BY id DESC
    `;

    const { results } = await db.prepare(query).all();
    return jsonResponse(results ?? []);
  } catch (error) {
    return handleError(error);
  }
}
