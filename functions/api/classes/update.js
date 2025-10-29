import { ensureDb, jsonResponse, handleError } from './utils';

export const onRequestPost = async (context) => {
  try {
    const DB = await ensureDb(context);
    const { id, name, category, code } = await context.request.json();

    const statement = DB.prepare(
      `UPDATE classes SET name = ?1, category = ?2, code = ?3 WHERE id = ?4`
    );
    await statement.bind(name, category, code, id).run();

    return jsonResponse({ success: true, message: '수업 정보가 수정되었습니다.' });
  } catch (error) {
    return handleError(error);
  }
};
