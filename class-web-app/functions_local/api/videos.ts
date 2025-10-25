import { Hono } from 'hono';

import { ensureBaseSchema, normaliseDate } from './_utils';

interface Env {
  DB: D1Database;
}

type VideoRow = {
  id: number;
  title: string;
  url: string;
  description: string | null;
  class_id: number;
  created_at: string;
  display_order: number | null;
};

const toVideoPayload = (row: VideoRow) => ({
  id: row.id,
  title: row.title,
  url: row.url,
  description: row.description,
  classId: row.class_id,
  createdAt: normaliseDate(row.created_at),
  displayOrder: row.display_order,
});

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  await ensureBaseSchema(c.env.DB);

  const classIdParam = c.req.query('classId') ?? c.req.query('class_id');
  const classId = classIdParam ? Number(classIdParam) : null;

  const statement = classId
    ? c.env.DB.prepare(
        'SELECT * FROM videos WHERE class_id = ? ORDER BY display_order ASC, created_at DESC',
      ).bind(classId)
    : c.env.DB.prepare('SELECT * FROM videos ORDER BY class_id ASC, display_order ASC, created_at DESC');

  const { results } = await statement.all<VideoRow>();
  const videos = (results ?? []).map(toVideoPayload);

  return c.json({ success: true, videos });
});

app.post('/', async (c) => {
  await ensureBaseSchema(c.env.DB);

  const body = await c.req.json<{
    title?: string;
    url?: string;
    description?: string | null;
    classId?: number;
  }>();

  const title = body.title?.trim();
  const url = body.url?.trim();
  const description = body.description?.trim() ?? null;
  const classId = body.classId;

  if (!title) {
    return c.json({ success: false, message: '영상 제목은 필수입니다.' }, 400);
  }

  if (!url) {
    return c.json({ success: false, message: '영상 주소 또는 코드를 입력해주세요.' }, 400);
  }

  if (typeof classId !== 'number') {
    return c.json({ success: false, message: '수업 정보를 찾을 수 없습니다.' }, 400);
  }

  const { results: orderResult } = await c.env.DB
    .prepare('SELECT COALESCE(MAX(display_order), -1) as maxOrder FROM videos WHERE class_id = ?')
    .bind(classId)
    .all<{ maxOrder: number }>();

  const nextOrder = (orderResult?.[0]?.maxOrder ?? -1) + 1;

  const insertResult = await c.env.DB
    .prepare(
      'INSERT INTO videos (title, url, description, class_id, display_order) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(title, url, description, classId, nextOrder)
    .run();

  const insertedId = insertResult.meta.last_row_id;

  const inserted = await c.env.DB
    .prepare('SELECT * FROM videos WHERE id = ?')
    .bind(insertedId)
    .first<VideoRow>();

  if (!inserted) {
    return c.json({ success: false, message: '저장된 영상을 찾을 수 없습니다.' }, 500);
  }

  return c.json({ success: true, video: toVideoPayload(inserted) });
});

app.put('/order', async (c) => {
  await ensureBaseSchema(c.env.DB);

  const body = await c.req.json<{ classId?: number; orderedIds?: number[] }>();
  const classId = body.classId;
  const orderedIds = body.orderedIds;

  if (typeof classId !== 'number' || !Array.isArray(orderedIds)) {
    return c.json({ success: false, message: '정렬 정보를 확인할 수 없습니다.' }, 400);
  }

  const updateStatements = orderedIds.map((id, index) =>
    c.env.DB.prepare('UPDATE videos SET display_order = ? WHERE id = ? AND class_id = ?').bind(
      index,
      id,
      classId,
    ),
  );

  for (const statement of updateStatements) {
    await statement.run();
  }

  const { results } = await c.env.DB
    .prepare('SELECT * FROM videos WHERE class_id = ? ORDER BY display_order ASC, created_at DESC')
    .bind(classId)
    .all<VideoRow>();

  const videos = (results ?? []).map(toVideoPayload);

  return c.json({ success: true, videos });
});

app.delete('/:id', async (c) => {
  await ensureBaseSchema(c.env.DB);

  const id = Number(c.req.param('id'));

  if (Number.isNaN(id)) {
    return c.json({ success: false, message: '삭제할 영상을 찾을 수 없습니다.' }, 400);
  }

  await c.env.DB.prepare('DELETE FROM videos WHERE id = ?').bind(id).run();

  return c.json({ success: true });
});

export default app;
