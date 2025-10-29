import {
  ensureDb,
  handleError,
  jsonResponse,
  normaliseClassPayload,
  parseId,
} from './utils';

const resolveClassId = (request, data) => {
  const url = new URL(request.url);
  const candidates = [
    url.searchParams.get('id'),
    data?.id,
    data?.class_id,
    data?.classId,
  ];

  for (const candidate of candidates) {
    const id = parseId(candidate);
    if (id !== null) {
      return id;
    }
  }

  return null;
};

export async function onRequest({ request, env }) {
  if (request.method !== 'PUT') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  try {
    const db = ensureDb(env);
    const data = await request.json().catch(() => ({}));
    const classId = resolveClassId(request, data);

    if (classId === null) {
      return jsonResponse({ error: 'Invalid class id' }, 400);
    }

    const payload = normaliseClassPayload(data);

    const result = await db
      .prepare(
        `UPDATE classes
           SET name = ?,
               category_id = ?,
               start_date = ?,
               end_date = ?,
               upload_limit = ?,
               upload_day = ?,
               code = ?,
               category = ?,
               duration = ?
         WHERE id = ?`
      )
      .bind(
        payload.name,
        payload.category_id,
        payload.start_date,
        payload.end_date,
        payload.upload_limit,
        payload.upload_day,
        payload.code,
        payload.category,
        payload.duration,
        classId,
      )
      .run();

    if (!result?.meta?.changes) {
      return jsonResponse({ error: 'Class not found' }, 400);
    }

    return jsonResponse({ success: true, id: classId });
  } catch (error) {
    return handleError(error);
  }
}
