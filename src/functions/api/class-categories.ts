import { Hono } from 'hono';

type Env = {
  DB: D1Database;
};

type CategoryRow = {
  id: number;
  name: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const app = new Hono<{ Bindings: Env }>();

const ensureCategoriesTable = async (db: D1Database) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS class_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

const normaliseName = (value: unknown): string | null => {
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

const mapRow = (row: CategoryRow) => ({
  id: Number(row.id),
  name: typeof row.name === 'string' ? row.name : null,
  createdAt: row.created_at ?? null,
  updatedAt: row.updated_at ?? null,
});

app.get('/', async (c) => {
  try {
    await ensureCategoriesTable(c.env.DB);
    const { results } = await c.env.DB
      .prepare('SELECT id, name, created_at, updated_at FROM class_categories ORDER BY name COLLATE NOCASE ASC, id ASC')
      .all<CategoryRow>();

    return c.json({ success: true, data: (results ?? []).map((row) => mapRow(row)) });
  } catch (error) {
    console.error('[class-categories] failed to load categories', error);
    const message = error instanceof Error ? error.message : '카테고리 목록을 불러오지 못했습니다.';
    return c.json({ success: false, message }, 500);
  }
});

app.get('/:id', async (c) => {
  try {
    await ensureCategoriesTable(c.env.DB);
    const id = Number(c.req.param('id'));
    if (!Number.isFinite(id)) {
      return c.json({ success: false, message: '유효한 카테고리 ID를 전달해주세요.' }, 400);
    }

    const row = await c.env.DB
      .prepare('SELECT id, name, created_at, updated_at FROM class_categories WHERE id = ?1')
      .bind(id)
      .first<CategoryRow>();

    if (!row) {
      return c.json({ success: false, message: '해당 카테고리를 찾을 수 없습니다.' }, 404);
    }

    return c.json({ success: true, data: mapRow(row) });
  } catch (error) {
    console.error('[class-categories] failed to load category', error);
    const message = error instanceof Error ? error.message : '카테고리 정보를 불러오지 못했습니다.';
    return c.json({ success: false, message }, 500);
  }
});

app.post('/', async (c) => {
  try {
    await ensureCategoriesTable(c.env.DB);

    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch (error) {
      console.error('[class-categories] invalid JSON payload', error);
      return c.json({ success: false, message: '유효한 JSON 본문을 전달해주세요.' }, 400);
    }

    const name = normaliseName((payload as Record<string, unknown> | null)?.name);
    if (!name) {
      return c.json({ success: false, message: '카테고리명을 입력해주세요.' }, 400);
    }

    const inserted = await c.env.DB
      .prepare(
        `INSERT INTO class_categories (name, created_at, updated_at)
         VALUES (?1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT(name) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
         RETURNING id, name, created_at, updated_at`,
      )
      .bind(name)
      .first<CategoryRow>();

    if (!inserted) {
      return c.json({ success: true, data: null }, 201);
    }

    return c.json({ success: true, data: mapRow(inserted) }, 201);
  } catch (error) {
    console.error('[class-categories] failed to create category', error);
    const message = error instanceof Error ? error.message : '카테고리를 생성하지 못했습니다.';
    const status = message.includes('UNIQUE') ? 409 : 500;
    const friendly = status === 409 ? '이미 존재하는 카테고리입니다.' : message;
    return c.json({ success: false, message: friendly }, status);
  }
});

app.put('/:id', async (c) => {
  try {
    await ensureCategoriesTable(c.env.DB);

    const id = Number(c.req.param('id'));
    if (!Number.isFinite(id)) {
      return c.json({ success: false, message: '유효한 카테고리 ID를 전달해주세요.' }, 400);
    }

    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch (error) {
      console.error('[class-categories] invalid JSON payload', error);
      return c.json({ success: false, message: '유효한 JSON 본문을 전달해주세요.' }, 400);
    }

    const name = normaliseName((payload as Record<string, unknown> | null)?.name);
    if (!name) {
      return c.json({ success: false, message: '카테고리명을 입력해주세요.' }, 400);
    }

    const existing = await c.env.DB
      .prepare('SELECT id FROM class_categories WHERE id = ?1')
      .bind(id)
      .first<{ id: number }>();

    if (!existing) {
      return c.json({ success: false, message: '해당 카테고리를 찾을 수 없습니다.' }, 404);
    }

    const updated = await c.env.DB
      .prepare(
        `UPDATE class_categories
         SET name = ?1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?2
         RETURNING id, name, created_at, updated_at`,
      )
      .bind(name, id)
      .first<CategoryRow>();

    if (!updated) {
      return c.json({ success: false, message: '카테고리를 업데이트하지 못했습니다.' }, 500);
    }

    return c.json({ success: true, data: mapRow(updated) });
  } catch (error) {
    console.error('[class-categories] failed to update category', error);
    const message = error instanceof Error ? error.message : '카테고리를 수정하지 못했습니다.';
    const status = message.includes('UNIQUE') ? 409 : 500;
    const friendly = status === 409 ? '이미 존재하는 카테고리입니다.' : message;
    return c.json({ success: false, message: friendly }, status);
  }
});

app.delete('/:id', async (c) => {
  try {
    await ensureCategoriesTable(c.env.DB);

    const id = Number(c.req.param('id'));
    if (!Number.isFinite(id)) {
      return c.json({ success: false, message: '유효한 카테고리 ID를 전달해주세요.' }, 400);
    }

    const existing = await c.env.DB
      .prepare('SELECT id FROM class_categories WHERE id = ?1')
      .bind(id)
      .first<{ id: number }>();

    if (!existing) {
      return c.json({ success: false, message: '해당 카테고리를 찾을 수 없습니다.' }, 404);
    }

    await c.env.DB.prepare('DELETE FROM class_categories WHERE id = ?1').bind(id).run();
    return c.json({ success: true, message: '카테고리가 삭제되었습니다.' });
  } catch (error) {
    console.error('[class-categories] failed to delete category', error);
    const message = error instanceof Error ? error.message : '카테고리를 삭제하지 못했습니다.';
    return c.json({ success: false, message }, 500);
  }
});

app.notFound((c) => c.json({ success: false, message: '요청하신 API 경로를 찾을 수 없습니다.' }, 404));

app.onError((err, c) => {
  console.error('[class-categories] unexpected error', err);
  const message = err instanceof Error ? err.message : '서버 처리 중 오류가 발생했습니다.';
  return c.json({ success: false, message }, 500);
});

export default app;
