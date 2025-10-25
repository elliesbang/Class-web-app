import { Hono } from 'hono';

import { ensureBaseSchema } from './_utils';

interface Env {
  DB: D1Database;
}

type AssignmentUploadTime = 'all_day' | 'same_day';

const VALID_WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;

type ClassRow = {
  id: number;
  name: string;
  code: string | null;
  category: string | null;
  start_date: string | null;
  end_date: string | null;
  assignment_upload_time: string | null;
  assignment_upload_days: string | null;
  delivery_methods: string | null;
  is_active: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type ClassRequestBody = {
  name?: string | null;
  code?: string | null;
  category?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  assignmentUploadTime?: string | null;
  assignmentUploadDays?: unknown;
  deliveryMethods?: unknown;
  isActive?: unknown;
};

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return null;
};

const toNullableString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
};

const toNullableDate = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }
    return trimmed;
  }

  return null;
};

const parseBooleanFlag = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (normalised.length === 0) {
      return fallback;
    }

    if (['1', 'true', 'y', 'yes', 'on'].includes(normalised)) {
      return true;
    }

    if (['0', 'false', 'n', 'no', 'off'].includes(normalised)) {
      return false;
    }
  }

  return fallback;
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    const seen = new Set<string>();
    const filtered: string[] = [];

    for (const item of value) {
      const normalised =
        typeof item === 'string' ? item.trim() : item == null ? '' : String(item).trim();
      if (normalised.length === 0) {
        continue;
      }
      if (!seen.has(normalised)) {
        seen.add(normalised);
        filtered.push(normalised);
      }
    }

    return filtered;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return toStringArray(parsed);
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

const parseStoredArray = (value: string | null | undefined): string[] => {
  if (value == null) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return toStringArray(parsed);
    }
  } catch {
    // ignore JSON parse errors and fallback to comma separated values
  }

  return toStringArray(value);
};

const filterValidDays = (input: string[]): string[] => {
  const valid = new Set(VALID_WEEKDAYS);
  const seen = new Set<string>();
  const filtered: string[] = [];

  for (const day of input) {
    if (valid.has(day as (typeof VALID_WEEKDAYS)[number]) && !seen.has(day)) {
      seen.add(day);
      filtered.push(day);
    }
  }

  return filtered;
};

const normaliseAssignmentDays = (value: unknown, fallback: string[]): string[] => {
  if (value === undefined) {
    return [...fallback];
  }

  return filterValidDays(toStringArray(value));
};

const normaliseDeliveryMethods = (value: unknown, fallback: string[]): string[] => {
  if (value === undefined) {
    return [...fallback];
  }

  const parsed = toStringArray(value);
  return parsed.length > 0 ? parsed : [...fallback];
};

const normaliseAssignmentUploadTime = (
  value: unknown,
  fallback: AssignmentUploadTime,
): AssignmentUploadTime => {
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (normalised === 'same_day' || normalised === 'day_only' || normalised === 'single_day') {
      return 'same_day';
    }
    if (normalised === 'all_day') {
      return 'all_day';
    }
  }

  return fallback;
};

const toClassPayload = (row: ClassRow) => {
  const assignmentDays = filterValidDays(parseStoredArray(row.assignment_upload_days));
  const deliveryMethods = parseStoredArray(row.delivery_methods);

  return {
    id: row.id,
    name: row.name,
    code: toNullableString(row.code) ?? '',
    category: toNullableString(row.category) ?? '',
    startDate: toNullableDate(row.start_date),
    endDate: toNullableDate(row.end_date),
    assignmentUploadTime: normaliseAssignmentUploadTime(row.assignment_upload_time, 'all_day'),
    assignmentUploadDays: assignmentDays.length > 0 ? assignmentDays : [...VALID_WEEKDAYS],
    deliveryMethods: deliveryMethods.length > 0 ? deliveryMethods : ['영상보기'],
    isActive: parseBooleanFlag(row.is_active, true),
    createdAt: toNullableDate(row.created_at),
    updatedAt: toNullableDate(row.updated_at),
  };
};

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  try {
    await ensureBaseSchema(c.env.DB);

    const { results } = await c.env.DB
      .prepare(
        'SELECT * FROM classes ORDER BY created_at DESC, updated_at DESC, id DESC',
      )
      .all<ClassRow>();

    const classes = (results ?? []).map(toClassPayload);

    return c.json({ success: true, data: classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ success: false, message: '수업 목록 불러오기 실패', error: message }, 500);
  }
});

app.post('/', async (c) => {
  try {
    await ensureBaseSchema(c.env.DB);

    let payload: ClassRequestBody;
    try {
      payload = (await c.req.json<ClassRequestBody>()) ?? {};
    } catch {
      return c.json({ success: false, message: '유효한 JSON 본문이 필요합니다.' }, 400);
    }

    const name = toNonEmptyString(payload.name);
    if (!name) {
      return c.json({ success: false, message: '수업 이름은 필수입니다.' }, 400);
    }

    const code = toNullableString(payload.code);
    const category = toNullableString(payload.category);
    const startDate = toNullableDate(payload.startDate);
    const endDate = toNullableDate(payload.endDate);
    const assignmentUploadTime = normaliseAssignmentUploadTime(
      payload.assignmentUploadTime,
      'all_day',
    );
    const assignmentUploadDays = normaliseAssignmentDays(
      payload.assignmentUploadDays,
      [...VALID_WEEKDAYS],
    );
    const deliveryMethods = normaliseDeliveryMethods(payload.deliveryMethods, ['영상보기']);
    const isActive = parseBooleanFlag(payload.isActive, true);

    const insertResult = await c.env.DB
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      )
      .bind(
        name,
        code,
        category,
        startDate,
        endDate,
        assignmentUploadTime,
        JSON.stringify(assignmentUploadDays),
        JSON.stringify(deliveryMethods),
        isActive ? 1 : 0,
      )
      .run();

    const insertedId = insertResult.meta.last_row_id;

    const inserted = await c.env.DB
      .prepare('SELECT * FROM classes WHERE id = ?')
      .bind(insertedId)
      .first<ClassRow>();

    if (!inserted) {
      return c.json({ success: false, message: '생성된 수업 정보를 찾을 수 없습니다.' }, 500);
    }

    return c.json({ success: true, data: toClassPayload(inserted) });
  } catch (error) {
    console.error('Error saving class:', error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ success: false, message: '수업 저장 실패', error: message }, 500);
  }
});

app.put('/:id', async (c) => {
  try {
    await ensureBaseSchema(c.env.DB);

    const id = Number(c.req.param('id'));
    if (Number.isNaN(id)) {
      return c.json({ success: false, message: '수정할 수업을 찾을 수 없습니다.' }, 400);
    }

    const existing = await c.env.DB
      .prepare('SELECT * FROM classes WHERE id = ?')
      .bind(id)
      .first<ClassRow>();

    if (!existing) {
      return c.json({ success: false, message: '수업 정보를 찾을 수 없습니다.' }, 404);
    }

    let payload: ClassRequestBody;
    try {
      payload = (await c.req.json<ClassRequestBody>()) ?? {};
    } catch {
      return c.json({ success: false, message: '유효한 JSON 본문이 필요합니다.' }, 400);
    }

    const name = toNonEmptyString(payload.name) ?? existing.name;
    const code =
      Object.prototype.hasOwnProperty.call(payload, 'code')
        ? toNullableString(payload.code)
        : existing.code;
    const category =
      Object.prototype.hasOwnProperty.call(payload, 'category')
        ? toNullableString(payload.category)
        : existing.category;
    const startDate =
      Object.prototype.hasOwnProperty.call(payload, 'startDate')
        ? toNullableDate(payload.startDate)
        : existing.start_date;
    const endDate =
      Object.prototype.hasOwnProperty.call(payload, 'endDate')
        ? toNullableDate(payload.endDate)
        : existing.end_date;
    const existingDays = filterValidDays(parseStoredArray(existing.assignment_upload_days));
    const assignmentUploadDays = normaliseAssignmentDays(
      Object.prototype.hasOwnProperty.call(payload, 'assignmentUploadDays')
        ? payload.assignmentUploadDays
        : undefined,
      existingDays,
    );
    const assignmentUploadTime = normaliseAssignmentUploadTime(
      Object.prototype.hasOwnProperty.call(payload, 'assignmentUploadTime')
        ? payload.assignmentUploadTime
        : existing.assignment_upload_time,
      normaliseAssignmentUploadTime(existing.assignment_upload_time, 'all_day'),
    );
    const existingDeliveryMethods = parseStoredArray(existing.delivery_methods);
    const deliveryMethods = normaliseDeliveryMethods(
      Object.prototype.hasOwnProperty.call(payload, 'deliveryMethods')
        ? payload.deliveryMethods
        : undefined,
      existingDeliveryMethods.length > 0 ? existingDeliveryMethods : ['영상보기'],
    );
    const isActive = parseBooleanFlag(
      Object.prototype.hasOwnProperty.call(payload, 'isActive')
        ? payload.isActive
        : (existing.is_active ?? 1) !== 0,
      (existing.is_active ?? 1) !== 0,
    );

    await c.env.DB
      .prepare(
        `UPDATE classes SET
          name = ?,
          code = ?,
          category = ?,
          start_date = ?,
          end_date = ?,
          assignment_upload_time = ?,
          assignment_upload_days = ?,
          delivery_methods = ?,
          is_active = ?,
          updated_at = datetime('now')
        WHERE id = ?`,
      )
      .bind(
        name,
        code,
        category,
        startDate,
        endDate,
        assignmentUploadTime,
        JSON.stringify(assignmentUploadDays),
        JSON.stringify(deliveryMethods),
        isActive ? 1 : 0,
        id,
      )
      .run();

    const updated = await c.env.DB
      .prepare('SELECT * FROM classes WHERE id = ?')
      .bind(id)
      .first<ClassRow>();

    if (!updated) {
      return c.json({ success: false, message: '수정된 수업 정보를 찾을 수 없습니다.' }, 500);
    }

    return c.json({ success: true, data: toClassPayload(updated) });
  } catch (error) {
    console.error('Error updating class:', error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ success: false, message: '수업 수정 실패', error: message }, 500);
  }
});

app.delete('/:id', async (c) => {
  try {
    await ensureBaseSchema(c.env.DB);

    const id = Number(c.req.param('id'));
    if (Number.isNaN(id)) {
      return c.json({ success: false, message: '삭제할 수업을 찾을 수 없습니다.' }, 400);
    }

    const existing = await c.env.DB
      .prepare('SELECT id FROM classes WHERE id = ?')
      .bind(id)
      .first<{ id: number }>();

    if (!existing) {
      return c.json({ success: false, message: '수업 정보를 찾을 수 없습니다.' }, 404);
    }

    await c.env.DB.prepare('DELETE FROM classes WHERE id = ?').bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting class:', error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ success: false, message: '수업 삭제 실패', error: message }, 500);
  }
});

export default app;
