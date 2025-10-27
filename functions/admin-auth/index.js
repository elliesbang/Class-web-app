const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const errorResponse = (error) =>
  new Response(
    JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    },
  );

export const onRequestPost = async (context) => {
  try {
    const { ADMIN_EMAIL, ADMIN_PASSWORD } = context.env;
    const adminEmail = typeof ADMIN_EMAIL === 'string' ? ADMIN_EMAIL.trim() : '';
    const adminPassword = typeof ADMIN_PASSWORD === 'string' ? ADMIN_PASSWORD.trim() : '';

    if (!adminEmail || !adminPassword) {
      return jsonResponse(
        { success: false, count: 0, data: [], message: '관리자 인증 정보가 설정되지 않았습니다.' },
        500,
      );
    }

    let payload = {};
    try {
      payload = await context.request.json();
    } catch (parseError) {
      return jsonResponse(
        { success: false, count: 0, data: [], message: '올바른 JSON 형식의 요청이 필요합니다.' },
        400,
      );
    }

    const email = typeof payload.email === 'string' ? payload.email.trim() : '';
    const password = typeof payload.password === 'string' ? payload.password.trim() : '';

    if (!email || !password) {
      return jsonResponse(
        { success: false, count: 0, data: [], message: '이메일과 비밀번호를 모두 입력하세요.' },
        400,
      );
    }

    if (email !== adminEmail || password !== adminPassword) {
      return jsonResponse(
        { success: false, count: 0, data: [], message: '비밀번호 불일치 또는 등록되지 않은 관리자' },
        401,
      );
    }

    const rows = [{ name: '관리자', email: adminEmail }];

    return jsonResponse({ success: true, count: rows.length, data: rows });
  } catch (error) {
    // console.debug('[admin-auth] Failed to authenticate admin', error)
    return errorResponse(error);
  }
};
