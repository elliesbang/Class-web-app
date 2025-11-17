import { ApiError, assertMethod, handleApi, jsonResponse } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

const parseId = (value: string | null): number => {
  if (!value) {
    throw new ApiError(400, { error: 'id is required' });
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new ApiError(400, { error: 'id must be a valid number' });
  }

  return numeric;
};

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'DELETE');

    const user = await verifyToken(request, env);
    assertRole(user, 'admin');

    const url = new URL(request.url);
    const id = parseId(url.searchParams.get('id'));

    await env.DB.prepare('DELETE FROM class_category WHERE id = ?1').bind(id).run();

    return jsonResponse({ success: true, id });
  });
