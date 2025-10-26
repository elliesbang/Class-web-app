import { Hono } from 'hono';

interface Env {
  DB: D1Database;
}

type CategoryRow = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

const normaliseErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error occurred';
  }
};

const toCategoryPayload = (row: CategoryRow) => ({
  id: row.id,
  name: row.name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  try {
    const { results } = await c.env.DB
      .prepare('SELECT id, name, created_at, updated_at FROM categories ORDER BY id ASC')
      .all<CategoryRow>();

    const categories = (results ?? []).map(toCategoryPayload);

    return c.json({ success: true, data: categories });
  } catch (error) {
    return c.json({ success: false, message: normaliseErrorMessage(error) }, 500);
  }
});

app.post('/', async (c) => {
  let body: { name?: string | null };

  try {
    body = await c.req.json<{ name?: string | null }>();
  } catch (error) {
    return c.json({ success: false, message: '유효한 JSON 형식의 요청 본문을 전달해주세요.' }, 400);
  }

  const name = body.name?.trim();

  if (!name) {
    return c.json({ success: false, message: '카테고리 이름은 필수입니다.' }, 400);
  }

  const now = new Date().toISOString();

  try {
    const insertResult = await c.env.DB
      .prepare('INSERT INTO categories (name, created_at, updated_at) VALUES (?, ?, ?)')
      .bind(name, now, now)
      .run();

    const insertedId = insertResult.meta.last_row_id;

    if (!insertedId) {
      return c.json(
        { success: false, message: '카테고리 저장 결과를 확인할 수 없습니다.' },
        500,
      );
    }

    const inserted = await c.env.DB
      .prepare('SELECT id, name, created_at, updated_at FROM categories WHERE id = ? LIMIT 1')
      .bind(insertedId)
      .first<CategoryRow>();

    if (!inserted) {
      return c.json({ success: false, message: '저장된 카테고리를 찾을 수 없습니다.' }, 500);
    }

    return c.json({ success: true, data: toCategoryPayload(inserted) }, 201);
  } catch (error) {
    return c.json({ success: false, message: normaliseErrorMessage(error) }, 500);
  }
});

app.delete('/:id', async (c) => {
  const idParam = c.req.param('id');
  const id = Number(idParam);

  if (!idParam || Number.isNaN(id)) {
    return c.json({ success: false, message: '삭제할 카테고리 ID가 올바르지 않습니다.' }, 400);
  }

  try {
    const deleteResult = await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();

    if (deleteResult.meta.changes === 0) {
      return c.json({ success: false, message: '삭제할 카테고리를 찾을 수 없습니다.' }, 404);
    }

    return c.json({ success: true, message: '카테고리가 삭제되었습니다.' });
  } catch (error) {
    return c.json({ success: false, message: normaliseErrorMessage(error) }, 500);
  }
});

export const onRequest = app.fetch;
