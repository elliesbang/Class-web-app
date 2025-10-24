import type { Env } from './_utils';
import { ensureBaseSchema, jsonResponse } from './_utils';

type AdminRow = {
  name: string;
  email: string;
  password: string;
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  await ensureBaseSchema(env.DB);

  let payload: { email?: string; password?: string };
  try {
    payload = (await request.json()) as { email?: string; password?: string };
  } catch (error) {
    return jsonResponse(
      { success: false, message: '올바른 JSON 형식의 요청이 필요합니다.' },
      { status: 400 },
    );
  }

  const email = payload.email?.trim();
  const password = payload.password?.trim();

  if (!email || !password) {
    return jsonResponse({ success: false, message: '이메일과 비밀번호를 모두 입력하세요.' }, { status: 400 });
  }

  const admin = await env.DB.prepare('SELECT name, email, password FROM admins WHERE email = ?1')
    .bind(email)
    .first<AdminRow>();

  if (!admin || admin.password !== password) {
    return jsonResponse(
      { success: false, message: '비밀번호 불일치 또는 등록되지 않은 관리자' },
      { status: 401 },
    );
  }

  return jsonResponse({ success: true, data: { name: admin.name, email: admin.email } });
};
