import { Hono } from 'hono';

import { DB, withBindings } from './hono-utils';

interface Env {
  DB: D1Database;
}

const TABLE_CONFIG = {
  videos: {
    schema: `
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        class_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `,
    columns: ['title', 'url', 'class_id'] as const,
  },
  materials: {
    schema: `
      CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        link TEXT NOT NULL,
        class_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `,
    columns: ['title', 'link', 'class_id'] as const,
  },
  notices: {
    schema: `
      CREATE TABLE IF NOT EXISTS notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        class_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `,
    columns: ['title', 'content', 'class_id'] as const,
  },
  feedback: {
    schema: `
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        class_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `,
    columns: ['title', 'content', 'class_id'] as const,
  },
};

type TableName = keyof typeof TABLE_CONFIG;

const getTableName = (path: string): TableName => {
  const [, , table] = path.split('/');
  if (!table || !(table in TABLE_CONFIG)) {
    throw new Error('유효하지 않은 테이블입니다.');
  }
  return table as TableName;
};

const ensureTable = async (db: D1Database, table: TableName) => {
  await db.exec(TABLE_CONFIG[table].schema);
};

const app = new Hono<{ Bindings: Env }>();

app.onError((err, c) => {
  console.error('[Feedback API Error]', err);
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  return c.json({ error: message }, 500);
});

app.post('/', async (c) => {
  try {
    const table = getTableName(c.req.path);
    await ensureTable(c.env.DB, table);

    const body = await c.req.json();
    const config = TABLE_CONFIG[table];
    const values = config.columns.map((column) => body[column]);

    const placeholders = values.map(() => '?').join(', ');
    const query = `INSERT INTO ${table} (${config.columns.join(', ')}) VALUES (${placeholders})`;
    await c.env.DB.prepare(query).bind(...values).run();

    return c.json({ success: true, message: '등록 성공' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return c.json({ error: message }, 500);
  }
});

app.get('/', async (c) => {
  try {
    const table = getTableName(c.req.path);
    await ensureTable(c.env.DB, table);

    const classId = c.req.query('class_id');
    const query = classId
      ? `SELECT * FROM ${table} WHERE class_id = ? ORDER BY created_at DESC`
      : `SELECT * FROM ${table} ORDER BY created_at DESC`;

    const { results } = classId
      ? await c.env.DB.prepare(query).bind(classId).all()
      : await c.env.DB.prepare(query).all();

    return c.json({ success: true, data: results ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return c.json({ error: message }, 500);
  }
});

app.delete('/', async (c) => {
  try {
    const table = getTableName(c.req.path);
    await ensureTable(c.env.DB, table);

    const id = c.req.query('id');
    if (!id) {
      throw new Error('id는 필수 값입니다.');
    }

    await c.env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
    return c.json({ success: true, message: '삭제 완료' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return c.json({ error: message }, 500);
  }
});

export const onRequest = withBindings(app.fetch, { DB });

export default app;
