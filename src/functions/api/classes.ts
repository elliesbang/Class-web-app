import { Hono } from 'hono';

type Env = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT id, name FROM classes ORDER BY id ASC').all();
    return c.json({ success: true, data: results ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return c.json({ success: false, message }, 500);
  }
});

app.post('/', async (c) => {
  try {
    const body = await c.req.json<Record<string, unknown>>();

    const { results: tableInfo } = await c.env.DB.prepare("PRAGMA table_info('classes')").all();
    const availableColumns = (tableInfo ?? [])
      .map((column) => (typeof column?.name === 'string' ? column.name : null))
      .filter((name): name is string => Boolean(name));

    const data: Record<string, unknown> = {};

    if (availableColumns.includes('code')) {
      data.code = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : crypto.getRandomValues(new Uint32Array(4)).join('');
    }

    if (availableColumns.includes('is_active')) {
      data.is_active = 1;
    }

    for (const [key, value] of Object.entries(body ?? {})) {
      if (key === 'id' || key === 'code' || key === 'is_active') {
        continue;
      }

      if (availableColumns.includes(key) && value !== undefined) {
        data[key] = value;
      }
    }

    const columns = Object.keys(data);

    if (columns.length === 0) {
      return c.json({ success: false, message: '유효한 수업 정보를 제공해주세요.' }, 400);
    }

    const placeholders = columns.map(() => '?').join(', ');
    const query = `INSERT INTO classes (${columns.join(', ')}) VALUES (${placeholders})`;
    const values = columns.map((column) => data[column]);

    await c.env.DB.prepare(query).bind(...values).run();

    return c.json({ success: true, message: '수업이 성공적으로 생성되었습니다.' });
  } catch (error) {
    console.error('수업 생성 중 오류가 발생했습니다:', error);
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return c.json({ success: false, message: '수업 생성 중 오류가 발생했습니다.', error: message }, 500);
  }
});

export default app;
