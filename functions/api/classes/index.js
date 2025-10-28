import { ensureBaseSchema } from '../../_utils/index.js';

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const handleError = (error) => {
  console.error('[api/classes]', error);
  return jsonResponse(
    { success: false, message: error?.message || '서버 오류가 발생했습니다.' },
    500
  );
};

/** ✅ DB Row → JSON 변환 */
const mapRowToResponse = (row) => ({
  id: row.id,
  name: row.name || '',
  category_id: row.category_id || '',
  start_date: row.start_date || '',
  end_date: row.end_date || '',
  upload_limit: row.upload_limit || '',
  upload_day: row.upload_day || '',
  code: row.code || '',
  created_at: row.created_at || '',
  category: row.category || '',
  duration: row.duration || '',
});

/** ✅ 모든 수업 조회 */
const fetchAllClasses = async (db) => {
  const { results } = await db
    .prepare(`
      SELECT 
        id,
        name,
        category_id,
        start_date,
        end_date,
        upload_limit,
        upload_day,
        code,
        created_at,
        category,
        COALESCE(duration, '') AS duration
      FROM classes
      ORDER BY id DESC
    `)
    .all();
  return (results ?? []).map(mapRowToResponse);
};

/** ✅ 단일 수업 조회 */
const fetchClassById = async (db, id) => {
  const row = await db
    .prepare(`
      SELECT 
        id,
        name,
        category_id,
        start_date,
        end_date,
        upload_limit,
        upload_day,
        code,
        created_at,
        category,
        COALESCE(duration, '') AS duration
      FROM classes
      WHERE id = ?1
    `)
    .bind(id)
    .first();
  return row ? mapRowToResponse(row) : null;
};

/** ✅ GET */
export const onRequestGet = async ({ request, env }) => {
  try {
    await ensureBaseSchema(env.DB);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (id) {
      const data = await fetchClassById(env.DB, id);
      if (!data) return jsonResponse({ success: false, message: '해당 수업 없음' }, 404);
      return jsonResponse({ success: true, data });
    }
    const data = await fetchAllClasses(env.DB);
    return jsonResponse({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
};

/** ✅ POST (새 수업 추가) */
export const onRequestPost = async ({ request, env }) => {
  try {
    await ensureBaseSchema(env.DB);
    const body = await request.json();
    const now = new Date().toISOString();

    const result = await env.DB
      .prepare(`
        INSERT INTO classes 
        (name, category_id, start_date, end_date, upload_limit, upload_day, code, created_at, category, duration)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
      `)
      .bind(
        body.name || '',
        body.category_id || '',
        body.start_date || '',
        body.end_date || '',
        body.upload_limit || '',
        body.upload_day || '',
        body.code || '',
        now,
        body.category || '',
        body.duration || ''
      )
      .run();

    if (!result.success) throw new Error('수업 저장 중 오류가 발생했습니다.');
    const newId = result.lastInsertRowid;
    const created = await fetchClassById(env.DB, newId);
    return jsonResponse({ success: true, data: created, message: '수업이 저장되었습니다.' });
  } catch (error) {
    return handleError(error);
  }
};

/** ✅ DELETE */
export const onRequestDelete = async ({ request, env }) => {
  try {
    await ensureBaseSchema(env.DB);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return jsonResponse({ success: false, message: 'ID가 필요합니다.' }, 400);

    const result = await env.DB.prepare('DELETE FROM classes WHERE id=?1').bind(id).run();
    if (!result.success || (result.changes ?? 0) === 0)
      return jsonResponse({ success: false, message: '존재하지 않는 수업입니다.' }, 404);

    return jsonResponse({ success: true, message: '수업이 삭제되었습니다.' });
  } catch (error) {
    return handleError(error);
  }
};
