import { ensureDb, handleError, jsonResponse, parseId } from './utils';

export async function onRequestDelete({ request, env }) {
  try {
    const db = ensureDb(env);
    const { searchParams } = new URL(request.url);
    const classId = parseId(searchParams.get('id'));

    if (!classId) {
      const error = new Error('A valid "id" query parameter is required to delete a class.');
      error.status = 400;
      throw error;
    }

    const result = await db.prepare('DELETE FROM classes WHERE id = ?1').bind(classId).run();

    if (!result?.success || result.meta?.changes === 0) {
      const error = new Error(`Class with id ${classId} was not found.`);
      error.status = 404;
      throw error;
    }

    return jsonResponse({
      success: true,
      data: {
        id: classId,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
