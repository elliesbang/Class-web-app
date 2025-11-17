import bcrypt from 'bcryptjs';
import { ApiError, jsonResponse, requireJsonBody } from './api';
import { AuthUser, UserRole, generateAuthToken } from './auth';

const TABLE_BY_ROLE: Record<UserRole, string> = {
  student: 'student_account',
  vod: 'vod_account',
  admin: 'admin_account',
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

const normalize = (value: unknown): string => value?.toString().trim() ?? '';

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

export const handleLoginRequest = async (
  request: Request,
  env: LoginEnv,
  role: UserRole,
): Promise<Response> => {
  assertPost(request);
  const body = await requireJsonBody<LoginRequestBody>(request);

  const email = normalize(body.email);
  if (!email) {
    throw new ApiError(400, { error: 'Email is required' });
  }

  const table = TABLE_BY_ROLE[role];
  const { results } = await env.DB.prepare(`SELECT * FROM ${table} WHERE email = ?1 LIMIT 1`).bind(email).all<
    Record<string, unknown>
  >();
  const record = results?.[0];

  if (!record) {
    throw new ApiError(401, { error: 'Invalid credentials' });
  }

  let resolvedName = normalize(record.name);
  let resolvedEmail = normalize(record.email) || email;

  if (role === 'admin') {
    const password = normalize(body.password);
    if (!password) {
      throw new ApiError(400, { error: 'Password is required' });
    }

    const storedPassword = normalize((record as Record<string, unknown>).password) ||
      normalize((record as Record<string, unknown>).password_hash);

    if (!storedPassword || !passwordsMatch(password, storedPassword)) {
      throw new ApiError(401, { error: 'Invalid credentials' });
    }

    if (!resolvedName) {
      resolvedName = 'admin';
    }
  } else {
    const password = normalize(body.password);
    if (!password) {
      throw new ApiError(400, { error: 'Password is required' });
    }

    const name = normalize(body.name);
    if (!name) {
      throw new ApiError(400, { error: '이름을 입력하세요.' });
    }

    const storedPassword =
      normalize((record as Record<string, unknown>).password) ||
      normalize((record as Record<string, unknown>).password_hash);

    if (!storedPassword || !passwordsMatch(password, storedPassword)) {
      throw new ApiError(401, { error: 'Invalid credentials' });
    }

    if (resolvedName && resolvedName !== name) {
      throw new ApiError(401, { error: 'Invalid credentials' });
    }

    resolvedName = resolvedName || name;
  }

  const userId = normalize((record as Record<string, unknown>).id);
  if (!userId) {
    throw new ApiError(500, { error: '계정 ID가 없습니다.' });
  }

  const authUser: AuthUser = {
    user_id: userId,
    role,
    email: resolvedEmail,
    name: resolvedName,
  };

  const token = await generateAuthToken(authUser, env.JWT_SECRET);

  return jsonResponse({ ...authUser, token });
};

const assertPost = (request: Request) => {
  if (request.method.toUpperCase() !== 'POST') {
    throw new ApiError(405, { error: 'Method Not Allowed' });
  }
};
