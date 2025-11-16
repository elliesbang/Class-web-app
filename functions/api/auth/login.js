import {
  comparePassword,
  createToken,
  findUserByEmail,
  getDB,
  handleError,
  insertSessionToken,
  jsonResponse,
  normaliseEmail,
  normaliseString,
  readRequestBody,
  resolveUserType,
} from './utils';

export const onRequestPost = async (context) => {
  try {
    const body = await readRequestBody(context.request);
    const email = normaliseEmail(body?.email);
    const password = normaliseString(body?.password);
    const userType = resolveUserType(body?.userType);

    if (!email || !password) {
      return jsonResponse({ success: false, message: '이메일과 비밀번호를 모두 입력하세요.' }, 400);
    }

    const db = getDB(context.env);
    const user = await findUserByEmail(db, userType, email);

    if (!user) {
      return jsonResponse({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401);
    }

    const validPassword = await comparePassword(password, user.password);

    if (!validPassword) {
      return jsonResponse({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401);
    }

    const refreshToken = createToken();
    await insertSessionToken(db, { userId: user.id, userType, refreshToken });

    return jsonResponse({
      success: true,
      userId: user.id,
      userType,
      refreshToken,
    });
  } catch (error) {
    return handleError(error);
  }
};
