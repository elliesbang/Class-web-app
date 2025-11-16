import {
  createPasswordResetToken,
  findUserByEmail,
  getDB,
  handleError,
  jsonResponse,
  normaliseEmail,
  readRequestBody,
  resolveUserType,
} from '../utils';

export const onRequestPost = async (context) => {
  try {
    const body = await readRequestBody(context.request);
    const email = normaliseEmail(body?.email);
    const userType = resolveUserType(body?.userType);

    if (!email) {
      return jsonResponse({ success: false, message: '이메일 주소를 입력하세요.' }, 400);
    }

    const db = getDB(context.env);
    const user = await findUserByEmail(db, userType, email);

    if (!user) {
      return jsonResponse({ success: false, message: '해당 이메일을 찾을 수 없습니다.' }, 404);
    }

    const { token, expiresAt } = await createPasswordResetToken(db, { email, userType });

    return jsonResponse({
      success: true,
      resetToken: token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
};
