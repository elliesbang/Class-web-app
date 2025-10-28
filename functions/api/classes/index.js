import { ensureBaseSchema } from '../../_utils/index.js';

/* ---------- 공통 함수 ---------- */
const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const HttpError = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
};

const handleError = (err) => {
  console.error('[API Error]', err);
  const msg = err?.message || '서버 오류가 발생했습니다.';
  return json({ success: false, message: msg }, 500);
};

const safeStr = (v, d = '') => (v === undefined || v === null ? d : String(v));
const safeDate = (v) => (v ? String(v) : '');
const nowISO = () => new Date().toISOString();

/* ---------- Row 매핑 ---------- */
const mapRow = (r = {}) => ({
  id: r.id,
  name: safeStr(r.name),
  category_id: safeStr(r.category_id),
  start_date: safeDate(r.start_date),
  end_date: safeDate(r.end_date),
  upload_limit: safeStr(r.upload_limit), // 
  upload_day: safeStr(r.upload_day),
  code: safeStr(r.code),
  created_at: safeDate(r.created_at),
  category: safeStr(r.category),
  duration: safeStr(r.duration, ''), // ✅ undefined 방지
});

/* ---------- SELECT ---------- */
const selectCols = `
  id, name, code, category_id, category,
  start_date, end_date, upload_limit, upload_day, created_at,
  COALESCE(duration, '') AS duration
`;

const fetchAll = async (db) => {
  const { results } = await db
    .prepare(`SELECT ${selectCols} FROM classes ORDER BY id DESC`)
    .all();
  return (results || []).map(mapRow);
};

const fetchOne = async (db, id) => {
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
    const data = id ? await fetchOne(env.DB, id) : await fetchAll(env.DB);
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
    const name = safeStr(body.name);
    const code = safeStr(body.code);
    if (!name || !code) throw new HttpError(400, '수업명과 코드를 입력해주세요.');

    const insertSql = `
      INSERT INTO classes (
        name, code, category_id, start_date, end_date,
        upload_limit, upload_day, created_at, category, duration
      )
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
    `;

    const result = await env.DB
      .prepare(insertSql)
      .bind(
        name,
        code,
        safeStr(body.category_id),
        safeDate(body.start_date),
        safeDate(body.end_date),
        safeStr(body.upload_limit), // ✅ 순서 맞춤
        safeStr(body.upload_day),
        nowISO(),
        safeStr(body.category),
        safeStr(body.duration)
      )
      .run();

    const newId = result?.lastInsertRowid;
    const created = await fetchOne(env.DB, newId);
    return json({ success: true, data: created, message: '수업이 저장되었습니다.' }, 201);
  } catch (err) {
    return handleError(err);
  }
};

/* ---------- PUT ---------- */
export const onRequestPut = async ({ request, env }) => {
  try {
    await ensureBaseSchema(env.DB);
    const body = await request.json();
    const id = Number(body.id);
    if (!id) throw new HttpError(400, 'ID가 필요합니다.');

    const updateSql = `
      UPDATE classes SET
        name = ?1, code = ?2, category_id = ?3,
        start_date = ?4, end_date = ?5, upload_limit = ?6,
        upload_day = ?7, created_at = ?8, category = ?9, duration = ?10
      WHERE id = ?11
    `;

    await env.DB
      .prepare(updateSql)
      .bind(
        safeStr(body.name),
        safeStr(body.code),
        safeStr(body.category_id),
        safeDate(body.start_date),
        safeDate(body.end_date),
        safeStr(body.upload_limit),
        safeStr(body.upload_day),
        nowISO(),
        safeStr(body.category),
        safeStr(body.duration),
        id
      )
      .run();

    const updated = await fetchOne(env.DB, id);
    return json({ success: true, data: updated, message: '수업이 수정되었습니다.' });
  } catch (err) {
    return handleError(err);
  }
};

/* ---------- DELETE ---------- */
export const onRequestDelete = async ({ request, env }) => {
  try {
    await ensureBaseSchema(env.DB);
    const url = new URL(request.url);
    const id = Number(url.searchParams.get('id'));
    await env.DB.prepare('DELETE FROM classes WHERE id = ?1').bind(id).run();
    return json({ success: true, message: '수업이 삭제되었습니다.' });
  } catch (err) {
    return handleError(err);
  }
};
