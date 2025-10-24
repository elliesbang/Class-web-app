import { Hono } from 'hono';

type Env = {
  DB: D1Database;
};

type ClassRow = {
  id: number;
  name: string | null;
  uploadOption: string | null;
  uploadTime: string | null;
  days: string | null;
  uploadPeriod: string | null;
  study: string | null;
  category_id: number | null;
};

type ClassResponse = {
  id: number;
  name: string | null;
  uploadOption: string | null;
  uploadTime: string | null;
  days: string | null;
  uploadPeriod: string | null;
  study: string | null;
  categoryId: number | null;
};

const ensureSchema = async (db: D1Database) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS class_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      uploadOption TEXT,
      uploadTime TEXT,
      days TEXT,
      uploadPeriod TEXT,
      study TEXT,
      category_id INTEGER,
      FOREIGN KEY (category_id) REFERENCES class_categories(id)
    );
  `);
};

const normaliseCategoryId = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
  }

  return null;
};

const mapRowToResponse = (row: ClassRow): ClassResponse => ({
  id: row.id,
  name: row.name ?? null,
  uploadOption: row.uploadOption ?? null,
  uploadTime: row.uploadTime ?? null,
  days: row.days ?? null,
  uploadPeriod: row.uploadPeriod ?? null,
  study: row.study ?? null,
  categoryId: row.category_id ?? null,
});

const normaliseText = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (value == null) {
    return null;
  }

  const stringified = String(value).trim();
  return stringified.length > 0 ? stringified : null;
};

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  try {
    await ensureSchema(c.env.DB);
    const { results } = await c.env.DB.prepare(
      'SELECT id, name, uploadOption, uploadTime, days, uploadPeriod, study, category_id FROM classes ORDER BY id DESC',
    ).all<ClassRow>();

    const data = (results ?? []).map((row) => mapRowToResponse(row));
    return c.json({ success: true, data });
  } catch (error) {
    console.error('[classes] failed to load classes', error);
    return c.json({ success: false, message: '수업 목록을 불러오지 못했습니다.' }, 500);
  }
});

app.post('/', async (c) => {
  try {
    await ensureSchema(c.env.DB);

    let payload: Record<string, unknown> | null = null;
    try {
      payload = (await c.req.json()) as Record<string, unknown> | null;
    } catch (error) {
      console.error('[classes] invalid JSON payload', error);
      return c.json({ success: false, message: '올바른 JSON 형식의 요청이 필요합니다.' }, 400);
    }

    const name = normaliseText(payload?.name ?? null);
    const uploadOption = normaliseText(payload?.uploadOption ?? null);
    const uploadTime = normaliseText(payload?.uploadTime ?? null);
    const days = normaliseText(payload?.days ?? null);
    const uploadPeriod = normaliseText(payload?.uploadPeriod ?? null);
    const study = normaliseText(payload?.study ?? null);
    const categoryId = normaliseCategoryId(payload?.category_id);

    const inserted = await c.env.DB
      .prepare(
        `INSERT INTO classes (name, uploadOption, uploadTime, days, uploadPeriod, study, category_id)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         RETURNING id, name, uploadOption, uploadTime, days, uploadPeriod, study, category_id`,
      )
      .bind(name ?? null, uploadOption ?? null, uploadTime ?? null, days ?? null, uploadPeriod ?? null, study ?? null, categoryId)
      .first<ClassRow>();

    console.log('수업이 정상적으로 저장되었습니다.');

    if (!inserted) {
      return c.json({ success: true, data: null }, 201);
    }

    return c.json({ success: true, data: mapRowToResponse(inserted) }, 201);
  } catch (error) {
    console.error('[classes] failed to save class', error);
    return c.json({ success: false, message: '수업 저장에 실패했습니다.' }, 500);
  }
});

export const onRequest: PagesFunction<Env> = (context) => app.fetch(context.request, context.env, context);

export const onRequestGet: PagesFunction<Env> = (context) => app.fetch(context.request, context.env, context);

export const onRequestPost: PagesFunction<Env> = (context) => app.fetch(context.request, context.env, context);

