import { Hono } from 'hono';

type Env = {
  DB: D1Database;
};

const ensureClassesTable = async (db: D1Database) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
  `);
};

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  try {
    await ensureClassesTable(c.env.DB);
    const { results } = await c.env.DB.prepare('SELECT id, name FROM classes ORDER BY id ASC').all();
    return c.json({ success: true, data: results ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return c.json({ success: false, message }, 500);
  }
});

app.post('/', async (c) => {
  try {
    await ensureClassesTable(c.env.DB);

    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch (error) {
      return c.json({ success: false, message: '유효한 JSON 본문을 전달해주세요.' }, 400);
    }

    const name = typeof (payload as { name?: unknown })?.name === 'string' ? (payload as { name: string }).name.trim() : '';
    if (name.length === 0) {
      return c.json({ success: false, message: '수업명을 입력해주세요.' }, 400);
    }

    await c.env.DB.prepare('INSERT INTO classes (name) VALUES (?1)').bind(name).run();
    const inserted = await c.env.DB
      .prepare('SELECT id, name FROM classes WHERE id = last_insert_rowid()')
      .first<{ id: number; name: string }>();

    if (!inserted) {
      return c.json({ success: true, data: [] }, 201);
    }

    return c.json({ success: true, data: [inserted] }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    const status = message.includes('UNIQUE constraint failed') ? 409 : 500;
    const friendlyMessage =
      status === 409 ? '이미 동일한 이름의 수업이 등록되어 있습니다. 다른 이름을 사용해주세요.' : message;
    return c.json({ success: false, message: friendlyMessage }, status);
  }
});

export default app;
