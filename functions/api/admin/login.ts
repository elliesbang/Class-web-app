interface Env {
  DB: D1Database;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  ADMIN_TOKEN: string;
}

const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { email, password } = body;
  if (!email || !password) {
    return jsonResponse({ error: 'Email and password are required' }, 400);
  }

  if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
    return jsonResponse({ error: 'Invalid credentials' }, 401);
  }

  return jsonResponse({ token: env.ADMIN_TOKEN });
};
