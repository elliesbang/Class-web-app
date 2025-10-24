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

export default app;
