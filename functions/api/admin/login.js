export const onRequest = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405 });
  }

  try {
    const body = await request
      .json()
      .catch(() => ({}));

    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !password) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const expectedEmail = (env.VITE_ADMIN_EMAIL || '').trim();
    const expectedPassword = (env.VITE_ADMIN_PASSWORD || '').trim();

    const isMatch = email === expectedEmail && password === expectedPassword;

    if (!isMatch) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = {
      success: true,
      accessToken: crypto.randomUUID(),
      role: 'admin',
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[api/admin/login] unexpected error', error);
    return new Response(JSON.stringify({ success: false, message: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
