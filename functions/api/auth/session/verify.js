import {
  deleteSessionByToken,
  findSessionByToken,
  findUserById,
  getDB,
  handleError,
  jsonResponse,
  normaliseString,
  readRequestBody,
  resolveUserType,
} from '../utils';

export const onRequestPost = async (context) => {
  try {
    const body = await readRequestBody(context.request);
    const refreshToken = normaliseString(body?.refreshToken);

    if (!refreshToken) {
      return jsonResponse({ success: false, message: 'refreshToken 값이 필요합니다.' }, 400);
    }

    const db = getDB(context.env);
    const session = await findSessionByToken(db, refreshToken);

    if (!session) {
      return jsonResponse({ success: false, message: '유효하지 않은 세션입니다.' }, 401);
    }

    const expiresAt = new Date(session.expires_at);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      await deleteSessionByToken(db, refreshToken);
      return jsonResponse({ success: false, message: '세션이 만료되었습니다.' }, 401);
    }

    const userType = resolveUserType(session.user_type);
    const user = await findUserById(db, userType, session.user_id);

    if (!user) {
      await deleteSessionByToken(db, refreshToken);
      return jsonResponse({ success: false, message: '사용자 정보를 찾을 수 없습니다.' }, 404);
    }

    return jsonResponse({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        userType,
      },
      refreshToken,
      expiresAt: session.expires_at,
    });
  } catch (error) {
    return handleError(error);
  }
};
