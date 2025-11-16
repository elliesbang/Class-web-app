import { deleteSessionByToken, getDB, handleError, jsonResponse, normaliseString, readRequestBody } from './utils';

export const onRequestPost = async (context) => {
  try {
    const body = await readRequestBody(context.request);
    const refreshToken = normaliseString(body?.refreshToken);

    if (!refreshToken) {
      return jsonResponse({ success: false, message: 'refreshToken 값이 필요합니다.' }, 400);
    }

    const db = getDB(context.env);
    await deleteSessionByToken(db, refreshToken);

    return jsonResponse({ success: true, message: '로그아웃되었습니다.' });
  } catch (error) {
    return handleError(error);
  }
};
