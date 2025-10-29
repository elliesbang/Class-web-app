import { ensureDb, jsonResponse, handleError } from './utils';

export const onRequestPost = async (context) => {
  try {
    const DB = await ensureDb(context);
    const { name, category, code } = await context.request.json();

    const statement = DB.prepare(
      `INSERT INTO classes (name, category, code) VALUES (?1, ?2, ?3)`
    );
    await statement.bind(name, category, code).run();

    return jsonResponse({ success: true, message: '수업이 추가되었습니다.' });
  } catch (error) {
    return handleError(error);
  }
};
