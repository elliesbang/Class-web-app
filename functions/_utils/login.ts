import bcrypt from 'bcryptjs';
import { ApiError, jsonResponse, requireJsonBody } from './api';
import { AuthUser, UserRole, generateAuthToken } from './auth';

const TABLE_BY_ROLE: Record<UserRole, string> = {
  student: 'student_account',
  vod: 'vod_account',
  admin: 'admin_account',
};

const stringOrNull = (value: unknown): string | null => {
  if (value == null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return String(value ?? '').trim() || null;
};

const extractName = (record: Record<string, unknown>, fallback?: string | null): string => {
  const preferredKeys = ['name', 'full_name', 'display_name', 'student_name'];
  for (const key of preferredKeys) {
    if (record[key]) {
      const value = stringOrNull(record[key]);
      if (value) return value;
    }
  }

  for (const [key, value] of Object.entries(record)) {
    if (key.toLowerCase().includes('name')) {
      const normalised = stringOrNull(value);
      if (normalised) return normalised;
    }
  }

  return fallback ?? '';
};

const extractEmail = (record: Record<string, unknown>, fallback?: string | null): string => {
  const preferredKeys = ['email', 'user_email', 'login_email'];
  for (const key of preferredKeys) {
    const value = stringOrNull(record[key]);
    if (value) return value;
  }
  return fallback ?? '';
};

const extractPasswordHash = (record: Record<string, unknown>): string | null => {
  const preferredKeys = ['password_hash', 'passwordHash', 'password'];
  for (const key of preferredKeys) {
    const value = stringOrNull(record[key]);
    if (value) return value;
  }
  return null;
};

const passwordsMatch = (plain: string, stored: string): boolean => {
  if (!plain || !stored) return false;
  if (stored.startsWith('$2')) {
    try {
      return bcrypt.compareSync(plain, stored);
    } catch {
      return false;
    }
  }
  return stored === plain;
};

interface LoginRequestBody {
  email?: string;
  password?: string;
  name?: string;
}

interface LoginEnv {
  DB: D1Database;
  JWT_SECRET: string;
}

export const handleLoginRequest = async (
  request: Request,
  env: LoginEnv,
  role: UserRole,
): Promise<Response> => {
  assertRequestMethod(request);
  const body = await requireJsonBody<LoginRequestBody>(request);

  const email = stringOrNull(body.email);
  const name = stringOrNull(body.name);
  const password = stringOrNull(body.password);

  const table = TABLE_BY_ROLE[role];
  const isAdmin = role === 'admin';

  // --- 필수값 체크 ---
  if (!email) {
    throw new ApiError(400, { error: 'Email is required' });
  }

  const statement = env.DB.prepare(
    `SELECT * FROM ${table} WHERE email = ?1 LIMIT 1`
  ).bind(email);

  const { results } = await statement.all<Record<string, unknown>>();
  const record = results?.[0];

  if (!record) throw new ApiError(401, { error: 'Invalid credentials' });

  const storedHash = extractPasswordHash(record);

  // --- 관리자 로그인(email + password) ---
  if (isAdmin) {
    if (!password || !storedHash || !passwordsMatch(password, storedHash)) {
      throw new ApiError(401, { error: 'Invalid credentials' });
    }
  }

  // --- 학생/VOD 로그인(name + email) ---
  if (!isAdmin) {
    if (!name) {
      throw new ApiError(400, { error: '이름을 입력하세요.' });
    }

    const recordName = extractName(record, null);
    if (recordName !== name) {
      throw new ApiError(401, { error: 'Invalid credentials' });
    }
  }

  // --- user_id 추출 ---
  const userId =
    stringOrNull(record.id) ??
    stringOrNull(record.user_id) ??
    stringOrNull(record.uuid);

  if (!userId) throw new ApiError(500, { error: '계정 ID가 없습니다.' });

  const authUser: AuthUser = {
    user_id: userId,
    role,
    name: extractName(record, name),
    email: extractEmail(record, email),
  };

  const token = await generateAuthToken(authUser, env.JWT_SECRET);
  return jsonResponse({ ...authUser, token });
};

const assertRequestMethod = (request: Request) => {
  if (request.method !== 'POST') {
    throw new ApiError(405, { error: 'Method Not Allowed' });
  }
};