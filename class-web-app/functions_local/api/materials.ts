import { Hono } from 'hono';

import { ensureBaseSchema, normaliseDate } from './_utils';

interface Env {
  DB: D1Database;
}

type MaterialRow = {
  id: number;
  title: string;
  file_url: string;
  description: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  class_id: number;
  created_at: string;
};

const toMaterialPayload = (row: MaterialRow) => ({
  id: row.id,
  title: row.title,
  fileUrl: row.file_url,
  description: row.description,
  fileName: row.file_name,
  mimeType: row.mime_type,
  fileSize: row.file_size,
  classId: row.class_id,
  createdAt: normaliseDate(row.created_at),
});

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  await ensureBaseSchema(c.env.DB);

  const classIdParam = c.req.query('classId') ?? c.req.query('class_id');
  const classId = classIdParam ? Number(classIdParam) : null;

  const statement = classId
    ? c.env.DB.prepare('SELECT * FROM materials WHERE class_id = ? ORDER BY created_at DESC').bind(classId)
    : c.env.DB.prepare('SELECT * FROM materials ORDER BY created_at DESC');

  const { results } = await statement.all<MaterialRow>();
  const materials = (results ?? []).map(toMaterialPayload);

  return c.json({ success: true, materials });
});

app.post('/', async (c) => {
  await ensureBaseSchema(c.env.DB);

  const body = await c.req.json<{
    title?: string;
    description?: string | null;
    classId?: number;
    fileUrl?: string;
    fileName?: string | null;
    mimeType?: string | null;
    fileSize?: number | null;
  }>();

  const title = body.title?.trim();
  const classId = body.classId;
  const description = body.description?.trim() ?? null;
  const fileUrl = body.fileUrl;
  const fileName = body.fileName ?? null;
  const mimeType = body.mimeType ?? null;
  const fileSize = typeof body.fileSize === 'number' ? body.fileSize : null;

  if (!title) {
    return c.json({ success: false, message: '자료 제목을 입력해주세요.' }, 400);
  }

  if (typeof classId !== 'number') {
    return c.json({ success: false, message: '수업 정보를 찾을 수 없습니다.' }, 400);
  }

  if (!fileUrl) {
    return c.json({ success: false, message: '업로드할 파일을 선택해주세요.' }, 400);
  }

  const insertResult = await c.env.DB
    .prepare(
      'INSERT INTO materials (title, file_url, description, file_name, mime_type, file_size, class_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(title, fileUrl, description, fileName, mimeType, fileSize, classId)
    .run();

  const insertedId = insertResult.meta.last_row_id;

  const inserted = await c.env.DB
    .prepare('SELECT * FROM materials WHERE id = ?')
    .bind(insertedId)
    .first<MaterialRow>();

  if (!inserted) {
    return c.json({ success: false, message: '저장된 자료를 찾을 수 없습니다.' }, 500);
  }

  return c.json({ success: true, material: toMaterialPayload(inserted) });
});

app.delete('/:id', async (c) => {
  await ensureBaseSchema(c.env.DB);

  const id = Number(c.req.param('id'));

  if (Number.isNaN(id)) {
    return c.json({ success: false, message: '삭제할 자료를 찾을 수 없습니다.' }, 400);
  }

  await c.env.DB.prepare('DELETE FROM materials WHERE id = ?').bind(id).run();

  return c.json({ success: true });
});

export default app;
