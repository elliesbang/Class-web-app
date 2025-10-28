import { ensureBaseSchema } from '../../_utils/index.js';

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const handleError = (err) => {
  console.error('[API Error]', err);
  return json({ success: false, message: err.message || '서버 오류' }, 500);
};

// undefined 방지
const safe = (v) => (v === undefined || v === null ? '' : v);

// row 매핑 함수
const mapRow = (r = {}) => ({
  id: safe(r.id),
  name: safe(r.name),
  category_id: safe(r.category_id),
  start_date: safe(r.start_date),
  end_date: safe(r.end_date),
  upload_limit: safe(r.upload_limit),
  upload_day: safe(r.upload_day),
  code: safe(r.code),
  created_at: safe(r.created_at),
  category: safe(r.category),
  duration: safe(r.duration),
});

// ✅ 실제 컬럼 순서 정확히 맞춤
const selectCols = `
  id, name, category_id, start_date, end_date,
  upload_limit, upload_day, code, created_at, category, duration
`;

// 전체 조회
const fetchAll = async (db) => {
  const { results } = await db.prepare(`SELECT ${selectCols} FROM classes ORDER BY id DESC`).all();
  return (results || []).map(mapRow);
};

// 단일 조회
const fetchById = async (db, id) => {
  const row = await db
    .prepare(`SELECT ${selectCols} FROM classes WHERE id = ?1`)
    .bind(id)
    .first();
  return row ? mapRow(row) : null;
};

// GET
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

// POST
export const onRequestPost = async ({ request, env }) => {
  try {
    await ensureBaseSchema(env.DB);
    const body = await request.json();

    const sql = `
      INSERT INTO classes (
        name, category_id, start_date, end_date,
        upload_limit, upload_day, code, created_at, category, duration
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, CURRENT_TIMESTAMP, ?8, ?9)
    `;

    await env.DB.prepare(sql)
      .bind(
        safe(body.name),
        safe(body.category_id),
        safe(body.start_date),
        safe(body.end_date),
        safe(body.upload_limit),
        safe(body.upload_day),
        safe(body.code),
        safe(body.category),
        safe(body.duration)
      )
      .run();

    return json({ success: true, message: '수업 등록 완료' }, 201);
  } catch (err) {
    return handleError(err);
  }
};

// PUT
export const onRequestPut = async ({ request, env }) => {
  try {
    await ensureBaseSchema(env.DB);
    const body = await request.json();

    const sql = `
      UPDATE classes SET
        name = ?1,
        category_id = ?2,
        start_date = ?3,
        end_date = ?4,
        upload_limit = ?5,
        upload_day = ?6,
        code = ?7,
        category = ?8,
        duration = ?9
      WHERE id = ?10
    `;

    await env.DB.prepare(sql)
      .bind(
        safe(body.name),
        safe(body.category_id),
        safe(body.start_date),
        safe(body.end_date),
        safe(body.upload_limit),
        safe(body.upload_day),
        safe(body.code),
        safe(body.category),
        safe(body.duration),
        body.id
      )
      .run();

    return json({ success: true, message: '수업 수정 완료' });
  } catch (err) {
    return handleError(err);
  }
};

// DELETE
export const onRequestDelete = async ({ request, env }) => {
  try {
    await ensureBaseSchema(env.DB);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    await env.DB.prepare('DELETE FROM classes WHERE id = ?1').bind(id).run();
    return json({ success: true, message: '수업 삭제 완료' });
  } catch (err) {
    return handleError(err);
  }
};
