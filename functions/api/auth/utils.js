import bcrypt from 'bcryptjs';

const USER_TABLES = {
  admin: 'admin_users',
  student: 'student_users',
  vod: 'vod_users',
};

const jsonResponse = (payload, status = 200) =>
  Response.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });

const readRequestBody = async (request) => {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('JSON 본문을 파싱할 수 없습니다.');
  }
};

const getDB = (env) => {
  const db = env?.DB;
  if (!db || typeof db.prepare !== 'function') {
    throw new Error('D1 Database binding(DB)이 유효하지 않습니다.');
  }
  return db;
};

const normaliseString = (value) => (typeof value === 'string' ? value.trim() : '');

const normaliseEmail = (value) => normaliseString(value);

const resolveUserType = (type) => {
  const normalised = normaliseString(type).toLowerCase();
  if (!USER_TABLES[normalised]) {
    throw new Error('지원하지 않는 사용자 유형입니다.');
  }
  return normalised;
};

const getTableName = (userType) => USER_TABLES[resolveUserType(userType)];

const findUserByEmail = async (db, userType, email) => {
  const table = getTableName(userType);
  return db
    .prepare(
      `SELECT id, email, password, name, created_at
       FROM ${table}
       WHERE email = ?1`,
    )
    .bind(email)
    .first();
};

const findUserById = async (db, userType, userId) => {
  const table = getTableName(userType);
  return db
    .prepare(
      `SELECT id, email, password, name, created_at
       FROM ${table}
       WHERE id = ?1`,
    )
    .bind(userId)
    .first();
};

const comparePassword = (password, hash) => bcrypt.compare(password, hash);

const hashPassword = (password, saltRounds = 10) => bcrypt.hash(password, saltRounds);

const createToken = () => `${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`;

const insertSessionToken = async (db, { userId, userType, refreshToken, ttlMinutes = 60 * 24 * 30 }) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

  await db
    .prepare(
      `INSERT INTO session_tokens (id, user_id, user_type, refresh_token, created_at, expires_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(crypto.randomUUID(), userId, resolveUserType(userType), refreshToken, now.toISOString(), expiresAt.toISOString())
    .run();

  return expiresAt;
};

const findSessionByToken = async (db, refreshToken) =>
  db
    .prepare(
      `SELECT id, user_id, user_type, refresh_token, created_at, expires_at
       FROM session_tokens
       WHERE refresh_token = ?1`,
    )
    .bind(refreshToken)
    .first();

const deleteSessionByToken = async (db, refreshToken) => {
  await db.prepare('DELETE FROM session_tokens WHERE refresh_token = ?1').bind(refreshToken).run();
};

const createPasswordResetToken = async (db, { email, userType, ttlMinutes = 60 }) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
  const token = createToken();

  await db
    .prepare(
      `INSERT INTO password_reset_tokens (id, user_email, user_type, reset_token, created_at, expires_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(crypto.randomUUID(), email, resolveUserType(userType), token, now.toISOString(), expiresAt.toISOString())
    .run();

  return { token, expiresAt };
};

const findPasswordResetToken = async (db, resetToken) =>
  db
    .prepare(
      `SELECT id, user_email, user_type, reset_token, created_at, expires_at
       FROM password_reset_tokens
       WHERE reset_token = ?1`,
    )
    .bind(resetToken)
    .first();

const deletePasswordResetToken = async (db, resetToken) => {
  await db.prepare('DELETE FROM password_reset_tokens WHERE reset_token = ?1').bind(resetToken).run();
};

const handleError = (error) => {
  const message = error instanceof Error ? error.message : '요청을 처리하는 중 오류가 발생했습니다.';
  return jsonResponse({ success: false, message }, 500);
};

export {
  USER_TABLES,
  comparePassword,
  createPasswordResetToken,
  createToken,
  deletePasswordResetToken,
  deleteSessionByToken,
  findPasswordResetToken,
  findSessionByToken,
  findUserByEmail,
  findUserById,
  getDB,
  getTableName,
  handleError,
  hashPassword,
  insertSessionToken,
  jsonResponse,
  normaliseEmail,
  normaliseString,
  readRequestBody,
  resolveUserType,
};
