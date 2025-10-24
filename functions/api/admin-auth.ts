import type { Env } from './_utils';
import { jsonResponse } from './_utils';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const adminEmail = env.ADMIN_EMAIL?.trim();
  const adminPassword = env.ADMIN_PASSWORD?.trim();

  if (!adminEmail || !adminPassword) {
    return jsonResponse(
      { success: false, message: '관리자 인증 정보가 설정되지 않았습니다.' },
      { status: 500 },
    );
  }

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

  if (email !== adminEmail || password !== adminPassword) {
    return jsonResponse(
      { success: false, message: '비밀번호 불일치 또는 등록되지 않은 관리자' },
      { status: 401 },
    );
  }

  return jsonResponse({ success: true, data: { name: '관리자', email: adminEmail } });
};
