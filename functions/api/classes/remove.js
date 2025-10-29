import { ensureDb, jsonResponse, handleError } from './utils';

export const onRequestDelete = async ({ request, env }) => {
  try {
    const db = await ensureDb(env);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) return jsonResponse({ error: 'Missing id' }, 400);

    await db.prepare(`DELETE FROM classes WHERE id = ?`).bind(id).run();

    return jsonResponse({ success: true, message: 'Class deleted successfully' });
  } catch (err) {
    return handleError(err);
  }
};
