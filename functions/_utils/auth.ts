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

export const verifyToken = async (request: Request, env: JwtEnv): Promise<AuthUser> => {
  const header = request.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, { error: 'Unauthorized' });
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new ApiError(401, { error: 'Unauthorized' });
  }

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

export const assertRole = (user: AuthUser, allowed: UserRole | UserRole[]) => {
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  if (!roles.includes(user.role)) {
    throw new ApiError(403, { error: 'Forbidden' });
  }
};

export const ensureOwnership = (user: AuthUser, ownerId: string) => {
  if (user.role === 'admin') {
    return;
  }
  if (user.user_id !== ownerId) {
    throw new ApiError(403, { error: 'Forbidden' });
  }
};
