import { Hono } from 'hono';

import { DB, withBindings } from './hono-utils';

import { ensureBaseSchema, normaliseDate } from './_utils';

interface Env {
  DB: D1Database;
}

type NoticeRow = {
  id: number;
  title: string;
  content: string;
  author: string | null;
  class_id: number;
  created_at: string;
};

const toNoticePayload = (row: NoticeRow) => ({
  id: row.id,
  title: row.title,
  content: row.content,
  author: row.author,
  classId: row.class_id,
  createdAt: normaliseDate(row.created_at),
});

const app = new Hono<{ Bindings: Env }>();

app.onError((err, c) => {
  console.error('[Notices API Error]', err);
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  return c.json({ error: message }, 500);
});

app.get('/', async (c) => {
  await ensureBaseSchema(c.env.DB);

  const classIdParam = c.req.query('classId') ?? c.req.query('class_id');
  const classId = classIdParam ? Number(classIdParam) : null;

  const statement = classId
    ? c.env.DB.prepare('SELECT * FROM notices WHERE class_id = ? ORDER BY created_at DESC').bind(classId)
    : c.env.DB.prepare('SELECT * FROM notices ORDER BY created_at DESC');

  const { results } = await statement.all<NoticeRow>();
  const notices = (results ?? []).map(toNoticePayload);

  return c.json({ success: true, notices });
});

app.post('/', async (c) => {
  await ensureBaseSchema(c.env.DB);

  const body = await c.req.json<{
    title?: string;
    content?: string;
    classId?: number;
    author?: string | null;
  }>();

  const title = body.title?.trim();
  const content = body.content?.trim();
  const classId = body.classId;
  const author = body.author?.trim() ?? null;

  if (!title) {
    return c.json({ success: false, message: '공지 제목을 입력해주세요.' }, 400);
  }

  if (!content) {
    return c.json({ success: false, message: '공지 내용을 입력해주세요.' }, 400);
  }

  if (typeof classId !== 'number') {
    return c.json({ success: false, message: '수업 정보를 찾을 수 없습니다.' }, 400);
  }

  const insertResult = await c.env.DB
    .prepare('INSERT INTO notices (title, content, author, class_id) VALUES (?, ?, ?, ?)')
    .bind(title, content, author, classId)
    .run();

  const insertedId = insertResult.meta.last_row_id;

  const inserted = await c.env.DB
    .prepare('SELECT * FROM notices WHERE id = ?')
    .bind(insertedId)
    .first<NoticeRow>();

  if (!inserted) {
    return c.json({ error: '저장된 공지를 찾을 수 없습니다.' }, 500);
  }

  return c.json({ success: true, notice: toNoticePayload(inserted) });
});

app.delete('/:id', async (c) => {
  await ensureBaseSchema(c.env.DB);

  const id = Number(c.req.param('id'));

  if (Number.isNaN(id)) {
    return c.json({ success: false, message: '삭제할 공지를 찾을 수 없습니다.' }, 400);
  }

  await c.env.DB.prepare('DELETE FROM notices WHERE id = ?').bind(id).run();

  return c.json({ success: true });
});

export const onRequest = withBindings(app.fetch, { DB });

export default app;
