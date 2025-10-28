import { ensureBaseSchema } from '../../_utils/index.js';

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
};

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
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number.parseInt(trimmed, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

const parseStringList = (input: unknown): string[] => {
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim();
        }
        if (item == null) {
          return '';
        }
        return String(item).trim();
      })
      .filter((item) => item.length > 0);
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parseStringList(parsed);
      }
    } catch {
      // ignore JSON parse errors and fallback to comma separated values
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
};

const serialiseStringList = (input: string[]): string => {
  const unique = Array.from(new Set(input.map((item) => item.trim()).filter((item) => item.length > 0)));
  return JSON.stringify(unique);
};

const normaliseAssignmentUploadTime = (value: unknown): 'all_day' | 'same_day' => {
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (normalised === 'same_day' || normalised === 'day_only' || normalised === 'single_day') {
      return 'same_day';
    }
  }

  return 'all_day';
};

const normaliseBoolean = (value: unknown, fallback = true): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (!normalised) {
      return fallback;
    }

    return (
      normalised === '1' ||
      normalised === 'true' ||
      normalised === 'y' ||
      normalised === 'yes' ||
      normalised === 'on'
    );
  }

  return fallback;
};

const normaliseDateValue = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  return null;
};

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
}

const normaliseClassPayload = (input: ClassPayloadInput) => {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const code = typeof input.code === 'string' ? input.code.trim() : '';
  const category = typeof input.category === 'string' ? input.category.trim() : '';
  const startDate = normaliseDateValue(input.startDate);
  const endDate = normaliseDateValue(input.endDate);
  const assignmentUploadTime = normaliseAssignmentUploadTime(input.assignmentUploadTime);
  const assignmentUploadDays = parseStringList(input.assignmentUploadDays);
  const deliveryMethods = parseStringList(input.deliveryMethods);
  const isActive = normaliseBoolean(input.isActive, true);

  const uniqueDays = Array.from(new Set(assignmentUploadDays));
  const uniqueMethods = Array.from(new Set(deliveryMethods));

  return {
    name,
    code,
    category,
    startDate,
    endDate,
    assignmentUploadTime,
    assignmentUploadDays: uniqueDays,
    deliveryMethods: uniqueMethods,
    isActive,
  };
};

const mapRowToResponse = (row: RawClassRow): ClassResponseRecord => ({
  id: Number(row.id),
  name: typeof row.name === 'string' ? row.name : '',
  code: typeof row.code === 'string' ? row.code : '',
  category: typeof row.category === 'string' ? row.category ?? '' : '',
  startDate: normaliseDateValue(row.start_date),
  endDate: normaliseDateValue(row.end_date),
  assignmentUploadTime: normaliseAssignmentUploadTime(row.assignment_upload_time),
  assignmentUploadDays: parseStringList(row.assignment_upload_days),
  deliveryMethods: parseStringList(row.delivery_methods),
  isActive: normaliseBoolean(row.is_active, true),
  createdAt: typeof row.created_at === 'string' ? row.created_at : null,
  updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
});

const fetchClassById = async (db: D1Database, id: number): Promise<ClassResponseRecord | null> => {
  const row = await db
    .prepare<RawClassRow>(
      `SELECT id, name, code, category, start_date, end_date, assignment_upload_time, assignment_upload_days,
              delivery_methods, is_active, created_at, updated_at
         FROM classes
        WHERE id = ?1`,
    )
    .bind(id)
    .first<RawClassRow>();

  return row ? mapRowToResponse(row) : null;
};

const fetchAllClasses = async (db: D1Database): Promise<ClassResponseRecord[]> => {
  const { results } = await db
    .prepare<RawClassRow>(
      `SELECT id, name, code, category, start_date, end_date, assignment_upload_time, assignment_upload_days,
              delivery_methods, is_active, created_at, updated_at
         FROM classes
        ORDER BY id DESC`,
    )
    .all<RawClassRow>();

  const rows = results ?? [];
  return rows.map((row) => mapRowToResponse(row));
};

const extractIdFromRequest = async (request: Request): Promise<number | null> => {
  const url = new URL(request.url);
  const queryId = normaliseId(url.searchParams.get('id'));
  if (queryId) {
    return queryId;
  }

  if (request.headers.get('content-length') === '0') {
    return null;
  }

  try {
    const body = await request.json();
    return normaliseId((body as { id?: unknown }).id);
  } catch {
    return null;
  }
};

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  try {
    await ensureBaseSchema(env.DB);

    const url = new URL(request.url);
    const id = normaliseId(url.searchParams.get('id'));

    if (id) {
      const record = await fetchClassById(env.DB, id);
      if (!record) {
        throw new HttpError(404, '존재하지 않는 수업입니다.');
      }

      return jsonResponse({ success: true, data: record });
    }

    const rows = await fetchAllClasses(env.DB);
    return jsonResponse({ success: true, data: rows });
  } catch (error) {
    return handleError(error);
  }
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  try {
    await ensureBaseSchema(env.DB);
    const payload = normaliseClassPayload(await parseJsonBody<ClassPayloadInput>(request));

    if (!payload.name) {
      throw new HttpError(400, '수업명을 입력해주세요.');
    }

    if (!payload.code) {
      throw new HttpError(400, '수업 코드를 입력해주세요.');
    }

    const now = new Date().toISOString();
    const result = await env.DB
      .prepare(
        `INSERT INTO classes (
            name,
            code,
            category,
            start_date,
            end_date,
            assignment_upload_time,
            assignment_upload_days,
            delivery_methods,
            is_active,
            created_at,
            updated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
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
      )
      .run();

    const insertedId = result.lastInsertRowid ? Number(result.lastInsertRowid) : null;
    if (!insertedId) {
      throw new HttpError(500, '수업 정보를 저장하지 못했습니다.');
    }

    const created = await fetchClassById(env.DB, insertedId);
    if (!created) {
      throw new HttpError(500, '생성된 수업 정보를 확인할 수 없습니다.');
    }

    return jsonResponse({ success: true, data: created, message: '수업이 저장되었습니다.' }, 201);
  } catch (error) {
    return handleError(error);
  }
};

export const onRequestPut = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  try {
    await ensureBaseSchema(env.DB);
    const rawPayload = await parseJsonBody<ClassPayloadInput & { id?: unknown }>(request);
    const id = normaliseId(rawPayload.id);

    if (!id) {
      throw new HttpError(400, '수업 ID가 필요합니다.');
    }

    const payload = normaliseClassPayload(rawPayload);

    if (!payload.name) {
      throw new HttpError(400, '수업명을 입력해주세요.');
    }

    if (!payload.code) {
      throw new HttpError(400, '수업 코드를 입력해주세요.');
    }

    const now = new Date().toISOString();
    const result = await env.DB
      .prepare(
        `UPDATE classes
            SET name = ?1,
                code = ?2,
                category = ?3,
                start_date = ?4,
                end_date = ?5,
                assignment_upload_time = ?6,
                assignment_upload_days = ?7,
                delivery_methods = ?8,
                is_active = ?9,
                updated_at = ?10
          WHERE id = ?11`
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
        id,
      )
      .run();

    if (!result.success || (typeof result.changes === 'number' && result.changes === 0)) {
      throw new HttpError(404, '존재하지 않는 수업입니다.');
    }

    const updated = await fetchClassById(env.DB, id);
    if (!updated) {
      throw new HttpError(500, '수정된 수업 정보를 확인할 수 없습니다.');
    }

    return jsonResponse({ success: true, data: updated, message: '수업이 저장되었습니다.' });
  } catch (error) {
    return handleError(error);
  }
};

export const onRequestDelete = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  try {
    await ensureBaseSchema(env.DB);
    const id = await extractIdFromRequest(request);

    if (!id) {
      throw new HttpError(400, '수업 ID가 필요합니다.');
    }

    const result = await env.DB.prepare('DELETE FROM classes WHERE id = ?1').bind(id).run();

    if (!result.success || (typeof result.changes === 'number' && result.changes === 0)) {
      throw new HttpError(404, '존재하지 않는 수업입니다.');
    }

    return jsonResponse({ success: true, message: '수업이 삭제되었습니다.' });
  } catch (error) {
    return handleError(error);
  }
};
