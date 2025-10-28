import { ensureBaseSchema } from '../../_utils/index.js';

// ✅ Cloudflare runtime uses JS version only
// TypeScript version removed to prevent runtime conflict

// ===== 유틸 함수 =====
const parseStringList = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
    return input.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const normaliseBoolean = (v, fallback = true) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return ['1', 'true', 'yes', 'on', 'y'].includes(v.trim().toLowerCase());
  return fallback;
};

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const handleError = (error) => {
  console.error('[api/classes]', error);
  const message =
    error instanceof Error ? error.message : '서버 내부 오류가 발생했습니다.';
  return jsonResponse({ success: false, message }, 500);
};

// ===== DB → 응답 변환 =====
const mapRowToResponse = (row) => ({
  id: Number(row.id),
  name: row.name ?? '',
  code: row.code ?? '',
  category: row.category ?? '',
  startDate: row.start_date ?? null,
  endDate: row.end_date ?? null,
  assignmentUploadTime:
    typeof row.assignment_upload_time === 'string' &&
    ['same_day', 'day_only', 'single_day'].includes(row.assignment_upload_time.trim().toLowerCase())
      ? 'same_day'
      : 'all_day',
  assignmentUploadDays: parseStringList(row.assignment_upload_days),
  deliveryMethods: parseStringList(row.delivery_methods),
  isActive: normaliseBoolean(row.is_active, true),
  createdAt: row.created_at ?? null,
  updatedAt: row.updated_at ?? null,
  duration: row.duration ?? '', // ✅ null-safe
});

// ===== DB 쿼리 =====
const fetchClassById = async (db, id) => {
  const row = await db
    .prepare(
      `SELECT id, name, code, category, start_date, end_date, assignment_upload_time,
              assignment_upload_days, delivery_methods, is_active, created_at, updated_at,
              COALESCE(duration, '') AS duration
       FROM classes WHERE id = ?1`
    )
    .bind(id)
    .first();
  return row ? mapRowToResponse(row) : null;
};

const fetchAllClasses = async (db) => {
  const { results } = await db
    .prepare(
      `SELECT id, name, code, category, start_date, end_date, assignment_upload_time,
              assignment_upload_days, delivery_methods, is_active, created_at, updated_at,
              COALESCE(duration, '') AS duration
       FROM classes ORDER BY id DESC`
    )
    .all();
  return (results ?? []).map(mapRowToResponse);
};

// ===== GET 요청 =====
export const onRequestGet = async ({ request, env }) => {
  try {
    await ensureBaseSchema(env.DB);
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');
    const id = idParam ? Number(idParam) : null;

    if (id) {
      const record = await fetchClassById(env.DB, id);
      if (!record) return jsonResponse({ success: false, message: '존재하지 않는 수업입니다.' }, 404);
      return jsonResponse({ success: true, data: record });
    }

    const all = await fetchAllClasses(env.DB);
    return jsonResponse({ success: true, data: all });
  } catch (error) {
    return handleError(error);
  }
};
