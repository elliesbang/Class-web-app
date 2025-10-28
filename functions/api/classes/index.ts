import { ensureBaseSchema } from '../../_utils/index.js';

// ===== 기본 타입 정의 =====
type D1Result<T = unknown> = {
  success: boolean;
  error?: string;
  results?: T[];
  lastInsertRowid?: number;
  changes?: number;
};

interface D1PreparedStatement<T = unknown> {
  bind(...values: unknown[]): D1PreparedStatement<T>;
  first<TRecord = T>(): Promise<TRecord | null>;
  run<TRecord = unknown>(): Promise<D1Result<TRecord>>;
  all<TRecord = T>(): Promise<D1Result<TRecord>>;
}

interface D1Database {
  prepare<T = unknown>(query: string): D1PreparedStatement<T>;
  exec(query: string): Promise<D1Result>;
}

interface Env {
  DB: D1Database;
}

// ===== Raw 데이터 & 응답 구조 =====
type RawClassRow = {
  id: number;
  name: string;
  code: string | null;
  category: string | null;
  start_date: string | null;
  end_date: string | null;
  assignment_upload_time: string | null;
  assignment_upload_days: string | null;
  delivery_methods: string | null;
  is_active: number | string | null;
  created_at: string | null;
  updated_at: string | null;
  duration?: string | null; // ✅ duration 컬럼 추가
};

type ClassResponseRecord = {
  id: number;
  name: string;
  code: string;
  category: string;
  startDate: string | null;
  endDate: string | null;
  assignmentUploadTime: 'all_day' | 'same_day';
  assignmentUploadDays: string[];
  deliveryMethods: string[];
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  duration: string | null; // ✅ 응답에도 포함
};

// ===== 유틸 =====
class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const jsonResponse = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const handleError = (error: unknown): Response => {
  if (error instanceof HttpError) {
    return jsonResponse({ success: false, message: error.message }, error.status);
  }
  console.error('[api/classes] unexpected error', error);
  const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
  return jsonResponse({ success: false, message }, 500);
};

const parseJsonBody = async <T>(request: Request): Promise<T> => {
  try {
    return (await request.json()) as T;
  } catch (error) {
    console.error('[api/classes] failed to parse JSON body', error);
    throw new HttpError(400, '유효한 JSON 본문이 필요합니다.');
  }
};

const normaliseId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
};

const parseStringList = (input: unknown): string[] => {
  if (Array.isArray(input)) {
    return input.map(String).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof input === 'string' && input.trim()) {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parseStringList(parsed);
    } catch {}
    return input.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const serialiseStringList = (arr: string[]): string => JSON.stringify([...new Set(arr.map((s) => s.trim()).filter(Boolean))]);

const normaliseAssignmentUploadTime = (v: unknown): 'all_day' | 'same_day' => {
  if (typeof v === 'string') {
    const val = v.trim().toLowerCase();
    if (['same_day', 'day_only', 'single_day'].includes(val)) return 'same_day';
  }
  return 'all_day';
};

const normaliseBoolean = (v: unknown, fallback = true): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return ['1', 'true', 'yes', 'on', 'y'].includes(v.trim().toLowerCase());
  return fallback;
};

const normaliseDateValue = (v: unknown): string | null => {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  return null;
};

// ===== Payload Normalizer =====
interface ClassPayloadInput {
  name?: unknown;
  code?: unknown;
  category?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  assignmentUploadTime?: unknown;
  assignmentUploadDays?: unknown;
  deliveryMethods?: unknown;
  isActive?: unknown;
  duration?: unknown;
}

const normaliseClassPayload = (input: ClassPayloadInput) => ({
  name: typeof input.name === 'string' ? input.name.trim() : '',
  code: typeof input.code === 'string' ? input.code.trim() : '',
  category: typeof input.category === 'string' ? input.category.trim() : '',
  startDate: normaliseDateValue(input.startDate),
  endDate: normaliseDateValue(input.endDate),
  assignmentUploadTime: normaliseAssignmentUploadTime(input.assignmentUploadTime),
  assignmentUploadDays: parseStringList(input.assignmentUploadDays),
  deliveryMethods: parseStringList(input.deliveryMethods),
  isActive: normaliseBoolean(input.isActive, true),
  duration: typeof input.duration === 'string' ? input.duration.trim() : null, // ✅ duration 추가
});

// ===== DB → API 변환 =====
const mapRowToResponse = (row: RawClassRow): ClassResponseRecord => ({
  id: Number(row.id),
  name: row.name ?? '',
  code: row.code ?? '',
  category: row.category ?? '',
  startDate: normaliseDateValue(row.start_date),
  endDate: normaliseDateValue(row.end_date),
  assignmentUploadTime: normaliseAssignmentUploadTime(row.assignment_upload_time),
  assignmentUploadDays: parseStringList(row.assignment_upload_days),
  deliveryMethods: parseStringList(row.delivery_methods),
  isActive: normaliseBoolean(row.is_active, true),
  createdAt: row.created_at ?? null,
  updatedAt: row.updated_at ?? null,
  duration: row.duration ?? null, // ✅ 안전하게 duration 포함
});

// ===== DB 쿼리 =====
const fetchClassById = async (db: D1Database, id: number): Promise<ClassResponseRecord | null> => {
  const row = await db
    .prepare<RawClassRow>(
      `SELECT id, name, code, category, start_date, end_date, assignment_upload_time, assignment_upload_days,
              delivery_methods, is_active, created_at, updated_at, duration
         FROM classes WHERE id = ?1`,
    )
    .bind(id)
    .first<RawClassRow>();

  return row ? mapRowToResponse(row) : null;
};

const fetchAllClasses = async (db: D1Database): Promise<ClassResponseRecord[]> => {
  const { results } = await db
    .prepare<RawClassRow>(
      `SELECT id, name, code, category, start_date, end_date, assignment_upload_time, assignment_upload_days,
              delivery_methods, is_active, created_at, updated_at, duration
         FROM classes ORDER BY id DESC`,
    )
    .all<RawClassRow>();

  return (results ?? []).map(mapRowToResponse);
};

// ===== GET =====
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  try {
    await ensureBaseSchema(env.DB);
    const url = new URL(request.url);
    const id = normaliseId(url.searchParams.get('id'));
    if (id) {
      const record = await fetchClassById(env.DB, id);
      if (!record) throw new HttpError(404, '존재하지 않는 수업입니다.');
      return jsonResponse({ success: true, data: record });
    }
    return jsonResponse({ success: true, data: await fetchAllClasses(env.DB) });
  } catch (error) {
    return handleError(error);
  }
};

// ===== POST (새 수업 추가) =====
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  try {
    await ensureBaseSchema(env.DB);
    const payload = normaliseClassPayload(await parseJsonBody<ClassPayloadInput>(request));
    if (!payload.name) throw new HttpError(400, '수업명을 입력해주세요.');
    if (!payload.code) throw new HttpError(400, '수업 코드를 입력해주세요.');

    const now = new Date().toISOString();
    const result = await env.DB
      .prepare(
        `INSERT INTO classes (
            name, code, category, start_date, end_date,
            assignment_upload_time, assignment_upload_days,
            delivery_methods, is_active, created_at, updated_at, duration
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
      )
      .bind(
        payload.name,
        payload.code,
        payload.category || null,
        payload.startDate,
        payload.endDate,
        payload.assignmentUploadTime,
        serialiseStringList(payload.assignmentUploadDays),
        serialiseStringList(payload.deliveryMethods),
        payload.isActive ? 1 : 0,
        now,
        now,
        payload.duration // ✅ duration 추가
      )
      .run();

    const newId = result.lastInsertRowid ? Number(result.lastInsertRowid) : null;
    if (!newId) throw new HttpError(500, '수업 정보를 저장하지 못했습니다.');

    const created = await fetchClassById(env.DB, newId);
    return jsonResponse({ success: true, data: created, message: '수업이 저장되었습니다.' }, 201);
  } catch (error) {
    return handleError(error);
  }
};

// ===== PUT (수정) =====
export const onRequestPut = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  try {
    await ensureBaseSchema(env.DB);
    const raw = await parseJsonBody<ClassPayloadInput & { id?: unknown }>(request);
    const id = normaliseId(raw.id);
    if (!id) throw new HttpError(400, '수업 ID가 필요합니다.');
    const payload = normaliseClassPayload(raw);
    if (!payload.name) throw new HttpError(400, '수업명을 입력해주세요.');
    if (!payload.code) throw new HttpError(400, '수업 코드를 입력해주세요.');

    const now = new Date().toISOString();
    const result = await env.DB
      .prepare(
        `UPDATE classes
            SET name=?1, code=?2, category=?3, start_date=?4, end_date=?5,
                assignment_upload_time=?6, assignment_upload_days=?7,
                delivery_methods=?8, is_active=?9, updated_at=?10, duration=?11
          WHERE id=?12`
      )
      .bind(
        payload.name,
        payload.code,
        payload.category || null,
        payload.startDate,
        payload.endDate,
        payload.assignmentUploadTime,
        serialiseStringList(payload.assignmentUploadDays),
        serialiseStringList(payload.deliveryMethods),
        payload.isActive ? 1 : 0,
        now,
        payload.duration,
        id
      )
      .run();

    if (!result.success || (result.changes ?? 0) === 0) throw new HttpError(404, '존재하지 않는 수업입니다.');
    const updated = await fetchClassById(env.DB, id);
    return jsonResponse({ success: true, data: updated, message: '수업이 수정되었습니다.' });
  } catch (error) {
    return handleError(error);
  }
};

// ===== DELETE =====
export const onRequestDelete = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  try {
    await ensureBaseSchema(env.DB);
    const url = new URL(request.url);
    const id = normaliseId(url.searchParams.get('id'));
    if (!id) throw new HttpError(400, '수업 ID가 필요합니다.');
    const result = await env.DB.prepare('DELETE FROM classes WHERE id=?1').bind(id).run();
    if (!result.success || (result.changes ?? 0) === 0) throw new HttpError(404, '존재하지 않는 수업입니다.');
    return jsonResponse({ success: true, message: '수업이 삭제되었습니다.' });
  } catch (error) {
    return handleError(error);
  }
};