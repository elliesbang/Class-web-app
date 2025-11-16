import { sign, verify } from 'hono/jwt';
import { ApiError } from './api';

export type UserRole = 'student' | 'vod' | 'admin';

export interface AuthUser {
  user_id: string;
  role: UserRole;
  email: string;
  name: string;
}

export interface JwtEnv {
  JWT_SECRET: string;
}

interface TokenPayload {
  sub?: string;
  user_id?: string;
  role?: string;
  email?: string;
  name?: string;
  exp?: number;
}

const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24h

// ------------------------
// JWT 생성
// ------------------------
export const generateAuthToken = async (user: AuthUser, secret: string): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);

  return sign(
    {
      sub: user.user_id,
      role: user.role,
      email: user.email,
      name: user.name,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
    },
    secret,
  );
};

// ------------------------
// JWT 검증
// ------------------------
export const verifyToken = async (request: Request, env: JwtEnv): Promise<AuthUser> => {
  const header = request.headers.get('Authorization');

  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, { error: 'Unauthorized' });
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) throw new ApiError(401, { error: 'Unauthorized' });

  let payload: TokenPayload;
  try {
    payload = (await verify(token, env.JWT_SECRET)) as TokenPayload;
  } catch (error) {
    console.warn('[AUTH] Failed to verify token', error);
    throw new ApiError(401, { error: 'Invalid token' });
  }

  if (!payload || typeof payload !== 'object') {
    throw new ApiError(401, { error: 'Invalid token' });
  }

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new ApiError(401, { error: 'Token expired' });
  }

  const role = (payload.role ?? '').toString() as UserRole;
  const userId = payload.sub ?? payload.user_id;

  if (!role || !userId) {
    throw new ApiError(401, { error: 'Invalid token payload' });
  }

  return {
    user_id: String(userId),
    role,
    email: (payload.email ?? '').toString(),
    name: (payload.name ?? '').toString(),
  };
};

// ------------------------
// 역할(권한) 검사 — includes 오류 방지 버전
// ------------------------
export const assertRole = (user: AuthUser, allowed: UserRole | UserRole[]) => {
  // allowed가 undefined/null인 경우 안전 처리
  if (!allowed) {
    throw new ApiError(500, { error: 'Invalid role configuration' });
  }

  // 배열 형태로 강제 변환 + null 제거
  const roles: UserRole[] = Array.isArray(allowed)
    ? (allowed.filter(Boolean) as UserRole[])
    : [allowed];

  if (!roles || roles.length === 0) {
    throw new ApiError(500, { error: 'Invalid role configuration' });
  }

  // includes 자체는 roles가 빈 배열이어도 안전하지만
  // roles가 undefined일 경우 대비했기 때문에 여기서는 절대 오류 안 남.
  if (!roles.includes(user.role)) {
    throw new ApiError(403, { error: 'Forbidden' });
  }
};

// ------------------------
// 소유권 검사
// ------------------------
export const ensureOwnership = (user: AuthUser, ownerId: string) => {
  // 관리자면 무조건 허용
  if (user.role === 'admin') return;

  if (user.user_id !== ownerId) {
    throw new ApiError(403, { error: 'Forbidden' });
  }
};
