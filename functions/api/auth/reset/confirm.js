import {
  deletePasswordResetToken,
  findPasswordResetToken,
  getDB,
  getTableName,
  handleError,
  hashPassword,
  jsonResponse,
  normaliseString,
  readRequestBody,
  resolveUserType,
} from '../utils';

const MIN_PASSWORD_LENGTH = 8;

export const onRequestPost = async (context) => {
  try {
    const body = await readRequestBody(context.request);
    const resetToken = normaliseString(body?.resetToken);
    const newPassword = normaliseString(body?.newPassword);

    if (!resetToken) {
      return jsonResponse({ success: false, message: 'resetToken 값이 필요합니다.' }, 400);
    }

    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      return jsonResponse({ success: false, message: `새 비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.` }, 400);
    }

    const db = getDB(context.env);
    const tokenRecord = await findPasswordResetToken(db, resetToken);

    if (!tokenRecord) {
      return jsonResponse({ success: false, message: '유효하지 않은 토큰입니다.' }, 400);
    }

    const expiresAt = new Date(tokenRecord.expires_at);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      await deletePasswordResetToken(db, resetToken);
      return jsonResponse({ success: false, message: '토큰이 만료되었습니다.' }, 400);
    }

    const userType = resolveUserType(tokenRecord.user_type);
    const table = getTableName(userType);
    const hashedPassword = await hashPassword(newPassword);

    await db
      .prepare(`UPDATE ${table} SET password = ?1 WHERE email = ?2`)
      .bind(hashedPassword, tokenRecord.user_email)
      .run();

    await deletePasswordResetToken(db, resetToken);

    return jsonResponse({ success: true, message: '비밀번호가 재설정되었습니다.' });
  } catch (error) {
    return handleError(error);
  }
};
