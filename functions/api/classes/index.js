import { ensureDb, jsonResponse, handleError } from './utils';

export const onRequestGet = async ({ env }) => {
  try {
    const db = await ensureDb(env);
    const query = `
      SELECT id, name, category_id, start_date, end_date,
             upload_limit, upload_day, code, created_at, category, duration
      FROM classes
      ORDER BY id DESC
    `;
    const { results } = await db.prepare(query).all();
    return jsonResponse(results);
  } catch (err) {
    return handleError(err);
  }
};
