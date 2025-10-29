import { ensureDb, jsonResponse, handleError } from './utils';

export const onRequestGet = async (context) => {
  try {
    const DB = await ensureDb(context);
    const statement = DB.prepare(
      `SELECT id, name, category, code, created_at FROM classes ORDER BY id DESC`
    );
    const { results = [] } = await statement.all();

    return jsonResponse({ success: true, count: results.length, data: results });
  } catch (error) {
    return handleError(error);
  }
};
