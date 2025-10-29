// 🔄 Force Cloudflare Functions redeploy - 2024-08-27T00:00:00.000Z
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

const safe = (v) => (v === undefined || v === null ? '' : v);

const toNumberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normaliseBoolean = (value, defaultValue = 1) => {
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (typeof value === 'number') {
    return value !== 0 ? 1 : 0;
  }

  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (['1', 'true', 't', 'y', 'yes', 'on', '활성', 'active'].includes(normalised)) {
      return 1;
    }
    if (['0', 'false', 'f', 'n', 'no', 'off', '비활성', 'inactive'].includes(normalised)) {
      return 0;
    }
  }

  return defaultValue;
};

const toTrimmedStringOrNull = (value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (value === undefined || value === null) {
    return null;
  }

  const converted = String(value).trim();
  return converted.length > 0 ? converted : null;
};

const parseArrayInput = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim();
        }
        if (item === undefined || item === null) {
          return '';
        }
        return String(item).trim();
      })
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parseArrayInput(parsed);
      }
    } catch (error) {
      // ignore JSON parse errors and fallback to comma separated values
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
};

const serialiseArray = (value) => {
  const parsed = parseArrayInput(value);
  if (parsed.length === 0) {
    return null;
  }
  return JSON.stringify(parsed);
};

const normaliseClassPayload = (input = {}) => {
  const source = typeof input === 'object' && input !== null ? input : {};

  const name = toTrimmedStringOrNull(source.name);
  if (!name) {
    throw new Error('수업 이름(name)은 필수입니다.');
  }

  const category = toTrimmedStringOrNull(source.category ?? source.class_category) ?? '';
  const code = toTrimmedStringOrNull(source.code ?? source.class_code) ?? '';
  const categoryId = toNumberOrNull(source.category_id ?? source.categoryId);
  const startDate = toTrimmedStringOrNull(source.start_date ?? source.startDate);
  const endDate = toTrimmedStringOrNull(source.end_date ?? source.endDate);
  const duration = toTrimmedStringOrNull(source.duration ?? source.class_duration) ?? '';
  const description =
    toTrimmedStringOrNull(
      source.description ??
        source.class_description ??
        source.details ??
        source.summary,
    ) ?? '';

  const assignmentUploadTime =
    toTrimmedStringOrNull(
      source.assignment_upload_time ??
        source.assignmentUploadTime ??
        source.upload_limit ??
        source.uploadLimit,
    ) ?? 'all_day';

  const assignmentUploadDays =
    serialiseArray(
      source.assignment_upload_days ??
        source.assignmentUploadDays ??
        source.upload_day ??
        source.uploadDay,
    ) ?? JSON.stringify([]);

  const deliveryMethods =
    serialiseArray(source.delivery_methods ?? source.deliveryMethods) ?? JSON.stringify([]);

  const isActive = normaliseBoolean(source.is_active ?? source.isActive);

  return {
    name,
    code,
    category,
    category_id: categoryId,
    start_date: startDate,
    end_date: endDate,
    assignment_upload_time: assignmentUploadTime,
    assignment_upload_days: assignmentUploadDays,
    upload_limit: assignmentUploadTime,
    upload_day: assignmentUploadDays,
    delivery_methods: deliveryMethods,
    is_active: isActive,
    duration,
    description,
  };
};

const parseStoredArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return parseArrayInput(value);
  }

  return [];
};

// ✅ D1 DB 컬럼 순서와 완전히 동일하게 매핑
const mapRow = (r = {}) => {
  const row = typeof r === 'object' && r !== null ? r : {};

  const assignmentUploadTime =
    row.assignment_upload_time ??
    row.assignmentUploadTime ??
    row.upload_limit ??
    row.uploadLimit ??
    '';

  const assignmentUploadDaysRaw =
    row.assignment_upload_days ?? row.assignmentUploadDays ?? row.upload_day ?? row.uploadDay ?? '[]';

  const deliveryMethodsRaw = row.delivery_methods ?? row.deliveryMethods ?? '[]';

  const assignmentUploadDays = parseStoredArray(assignmentUploadDaysRaw);
  const deliveryMethods = parseStoredArray(deliveryMethodsRaw);

  const assignmentUploadDaysText = Array.isArray(assignmentUploadDaysRaw)
    ? JSON.stringify(parseArrayInput(assignmentUploadDaysRaw))
    : typeof assignmentUploadDaysRaw === 'string'
    ? assignmentUploadDaysRaw.trim() || '[]'
    : '[]';

  const deliveryMethodsText = Array.isArray(deliveryMethodsRaw)
    ? JSON.stringify(parseArrayInput(deliveryMethodsRaw))
    : typeof deliveryMethodsRaw === 'string'
    ? deliveryMethodsRaw.trim() || '[]'
    : '[]';

  const categoryId = toNumberOrNull(row.category_id ?? row.categoryId);
  const isActive = normaliseBoolean(row.is_active ?? row.isActive, 1);

  return {
    id: toNumberOrNull(row.id) ?? safe(row.id),
    name: safe(row.name),
    code: safe(row.code),
    category: safe(row.category),
    category_id: categoryId ?? '',
    start_date: safe(row.start_date),
    end_date: safe(row.end_date),
    assignment_upload_time: safe(assignmentUploadTime),
    assignment_upload_days: assignmentUploadDaysText || '[]',
    upload_limit: safe(assignmentUploadTime),
    upload_day: assignmentUploadDaysText || '[]',
    assignment_upload_days_array: assignmentUploadDays,
    delivery_methods: deliveryMethodsText || '[]',
    delivery_methods_array: deliveryMethods,
    is_active: isActive,
    created_at: safe(row.created_at),
    updated_at: safe(row.updated_at),
    categoryId,

    // ✅ duration undefined 방어 (대소문자/캐시 불일치 모두 대응)
    duration: safe(row.duration ?? row.DURATION ?? row.Duration ?? ''),
    description: safe(row.description ?? row.Description ?? row.details ?? ''),
  };
};

// ✅ SELECT 컬럼 순서도 완전히 동일
const selectCols = `
  id, name, code, category, category_id,
  start_date, end_date, assignment_upload_time, assignment_upload_days,
  upload_limit, upload_day, delivery_methods, is_active,
  duration, description, created_at, updated_at
`;

const fetchAll = async (db) => {
  const { results } = await db
    .prepare(`SELECT ${selectCols} FROM classes ORDER BY id DESC`)
    .all();
  return (results || []).map(mapRow);
};

const fetchById = async (db, id) => {
  const row = await db.prepare(`SELECT ${selectCols} FROM classes WHERE id = ?1`).bind(id).first();
  return row ? mapRow(row) : null;
};

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

export const onRequestPost = async ({ request, env }) => {
  try {
    await ensureBaseSchema(env.DB);
    const body = await request.json();
    const payload = normaliseClassPayload(body);

    const sql = `
      INSERT INTO classes (
        name, code, category, category_id,
        start_date, end_date, assignment_upload_time,
        assignment_upload_days, upload_limit, upload_day,
        delivery_methods, is_active, duration, description,
        created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING ${selectCols}
    `;

    const { results } = await env.DB.prepare(sql)
      .bind(
        payload.name,
        payload.code,
        payload.category,
        payload.category_id,
        payload.start_date,
        payload.end_date,
        payload.assignment_upload_time,
        payload.assignment_upload_days,
        payload.upload_limit,
        payload.upload_day,
        payload.delivery_methods,
        payload.is_active,
        payload.duration,
        payload.description,
      )
      .all();

    const created = results && results[0] ? mapRow(results[0]) : null;

    return json({ success: true, message: '수업 등록 완료', data: created ? [created] : [] }, 201);
  } catch (err) {
    return handleError(err);
  }
};

export const onRequestPut = async ({ request, env }) => {
  try {
    await ensureBaseSchema(env.DB);
    const body = await request.json();
    const payload = normaliseClassPayload(body);

    if (!body?.id) {
      throw new Error('수정할 수업 ID가 필요합니다.');
    }

    const sql = `
      UPDATE classes SET
        name = ?1,
        code = ?2,
        category = ?3,
        category_id = ?4,
        start_date = ?5,
        end_date = ?6,
        assignment_upload_time = ?7,
        assignment_upload_days = ?8,
        upload_limit = ?9,
        upload_day = ?10,
        delivery_methods = ?11,
        is_active = ?12,
        duration = ?13,
        description = ?14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?15
      RETURNING ${selectCols}
    `;

    const { results } = await env.DB.prepare(sql)
      .bind(
        payload.name,
        payload.code,
        payload.category,
        payload.category_id,
        payload.start_date,
        payload.end_date,
        payload.assignment_upload_time,
        payload.assignment_upload_days,
        payload.upload_limit,
        payload.upload_day,
        payload.delivery_methods,
        payload.is_active,
        payload.duration,
        payload.description,
        body.id,
      )
      .all();

    const updated = results && results[0] ? mapRow(results[0]) : null;

    return json({ success: true, message: '수업 수정 완료', data: updated ? [updated] : [] });
  } catch (err) {
    return handleError(err);
  }
};

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
