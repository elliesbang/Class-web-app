import { ensureBaseSchema } from '../../_utils/index.js';

/* ---------- 공통 ---------- */
const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const handleError = (err) => {
    console.error('[API Error]', err);
    return json({ success: false, message: err.message || '서버 오류' }, 500);
};

const nowISO = () => new Date().toISOString();

/* ---------- Row 변환 ---------- */
const mapRow = (r = {}) => ({
  id: r.id,
  name: r.name || '',
  category_id: r.category_id || '',
  start_date: r.start_date || '',
  end_date: r.end_date || '',
  upload_limit: r.upload_limit || '',
  upload_day: r.upload_day || '',
  code: r.code || '',
  created_at: r.created_at || '',
  category: r.category || '',
  duration: r.duration || '', // ✅ 실제 컬럼명 그대로 사용
});

/* ---------- SELECT ---------- */
const selectCols = `
  id, name, category_id, start_date, end_date,
  upload_limit, upload_day, code, created_at, category, duration
`;

const fetchAll = async (db) => {
  const { results } = await db
    .prepare(`SELECT ${selectCols} FROM classes ORDER BY id DESC`)
    .all();
  return (results || []).map(mapRow);
};

const fetchById = async (db, id) => {
  const row = await db
    .prepare(`SELECT ${selectCols} FROM classes WHERE id = ?1`)
    .bind(id)
    .first();
  return row ? mapRow(row) : null;
};

/* ---------- GET ---------- */
export const onRequestGet = async ({ request, env }) => {
  try {
    await ensureBaseSchema(env.DB);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const data = id ? await fetchById(env.DB, id) : await fetchAll(env.DB);
    return json({ success: true, data });
  } catch (err) {
    return handleError(err);
  }
};

/* ---------- POST ---------- */
export const onRequestPost = async ({ request, env }) => {
  try {
    await ensureBaseSchema(env.DB);
    const body = await request.json();

    const insertSQL = `
      INSERT INTO classes (
        name, category_id, start_date, end_date,
        upload_limit, upload_day, code, created_at, category, duration
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
    `;

    await env.DB.prepare(insertSQL).bind(
      body.name || '',
      body.category_id || '',
      body.start_date || '',
      body.end_date || '',
      body.upload_limit || '',
      body.upload_day || '',
      body.code || '',
      nowISO(),
      body.category || '',
      body.duration || ''
    ).run();

    return json({ success: true, message: '수업이 등록되었습니다.' }, 201);
  } catch (err) {
    return handleError(err);
  }
};

/* ---------- PUT ---------- */
export const onRequestPut = async ({ request, env }) => {
  try {
    await ensureBaseSchema(env.DB);
    const body = await request.json();

    const updateSQL = `
      UPDATE classes SET
        name = ?1, category_id = ?2, start_date = ?3, end_date = ?4,
        upload_limit = ?5, upload_day = ?6, code = ?7,
        category = ?8, duration = ?9
      WHERE id = ?10
    `;

    await env.DB.prepare(updateSQL).bind(
      body.name || '',
      body.category_id || '',
      body.start_date || '',
      body.end_date || '',
      body.upload_limit || '',
      body.upload_day || '',
      body.code || '',
      body.category || '',
      body.duration || '',
      body.id
    ).run();

    return json({ success: true, message: '수업이 수정되었습니다.' });
  } catch (err) {
    return handleError(err);
  }
};

/* ---------- DELETE ---------- */
export const onRequestDelete = async ({ request, env }) => {
  try {
    await ensureBaseSchema(env.DB);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    await env.DB.prepare('DELETE FROM classes WHERE id = ?1').bind(id).run();
    return json({ success: true, message: '수업이 삭제되었습니다.' });
  } catch (err) {
    return handleError(err);
  }
};
