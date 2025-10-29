import { ensureDb, jsonResponse, handleError } from './utils';

export const onRequestPost = async (context) => {
  try {
    const DB = await ensureDb(context);
    const { id } = await context.request.json();

    if (id == null) {
      throw new Error('수업 ID가 필요합니다.');
    }

    const statement = DB.prepare(`DELETE FROM classes WHERE id = ?1`);
    await statement.bind(id).run();

    return jsonResponse({ success: true, message: '수업이 삭제되었습니다.' });
  } catch (error) {
    return handleError(error);
  }
};
