import { ensureDb, jsonResponse, handleError } from './utils';

export const onRequestPost = async ({ request, env }) => {
  try {
    const db = await ensureDb(env);
    const body = await request.json();
    const {
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
      INSERT INTO classes (
        name,
        category_id,
        start_date,
        end_date,
        upload_limit,
        upload_day,
        code,
        category,
        duration,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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
      duration
    ).run();

    return jsonResponse({ success: true, message: 'Class created successfully' });
  } catch (err) {
    return handleError(err);
  }
};
