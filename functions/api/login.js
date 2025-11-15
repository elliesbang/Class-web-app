import {
  initNotion,
  queryDB,
  jsonResponse,
  errorResponse,
} from './utils/notion.js';

const ROLE_DATABASE_MAP = {
  student: 'DB_STUDENT_ACCOUNT',
  admin: 'DB_ADMIN_ACCOUNT',
  vod: 'DB_VOD_ACCOUNT',
};

const EMAIL_KEYS = ['Email', 'email', '이메일'];
const PASSWORD_KEYS = ['Password', 'password', '비밀번호'];
const NAME_KEYS = ['Name', 'name', '학생명', '관리자명'];
const ROLE_KEYS = ['Role', 'role', '역할'];

const headers = {
  'Content-Type': 'application/json',
};

function normaliseValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'object') {
    if ('name' in value) {
      return value.name ?? '';
    }

    if ('email' in value) {
      return value.email ?? '';
    }

    if ('plain_text' in value) {
      return value.plain_text ?? '';
    }

    return JSON.stringify(value);
  }

  return String(value);
}

function findProperty(properties, keys) {
  for (const key of keys) {
    if (key in properties) {
      return properties[key];
    }
  }

  return null;
}

export const onRequest = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405 });
  }

  try {
    initNotion(env);

    const body = await request.json();
    const { email, password, role } = body ?? {};

    if (!email || !password || !role) {
      return errorResponse(400, '이메일, 비밀번호, 역할은 필수입니다.');
    }

    const dbEnvKey = ROLE_DATABASE_MAP[role];
    if (!dbEnvKey || !env[dbEnvKey]) {
      return errorResponse(400, '지원하지 않는 역할입니다.');
    }

    const { results } = await queryDB(env[dbEnvKey], {}, env);

    const matched = results.find((page) => {
      const properties = page.properties ?? {};
      const storedEmail = normaliseValue(findProperty(properties, EMAIL_KEYS)).toLowerCase();
      const storedPassword = normaliseValue(findProperty(properties, PASSWORD_KEYS));

      return storedEmail === String(email).toLowerCase() && storedPassword === String(password);
    });

    if (!matched) {
      return errorResponse(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const properties = matched.properties ?? {};
    const responseUser = {
      id: matched.id,
      name: normaliseValue(findProperty(properties, NAME_KEYS)) || email,
      email: normaliseValue(findProperty(properties, EMAIL_KEYS)) || email,
      role:
        role ||
        normaliseValue(findProperty(properties, ROLE_KEYS)).toLowerCase() ||
        null,
      raw: properties,
    };

    return jsonResponse({ success: true, role, user: responseUser }, 200, { headers });
  } catch (error) {
    console.error('[login] failed', error);
    return errorResponse(500, '로그인 처리 중 오류가 발생했습니다.');
  }
};
