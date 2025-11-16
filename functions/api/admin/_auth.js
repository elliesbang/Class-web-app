export const isAdminRequest = (request, env) => {
  const expectedToken = env?.ADMIN_TOKEN;
  if (!expectedToken) {
    throw new Error('Missing ADMIN_TOKEN environment variable.');
  }
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim();
  const headerToken = request.headers.get('x-admin-token')?.trim();
  return token === expectedToken || headerToken === expectedToken;
};
