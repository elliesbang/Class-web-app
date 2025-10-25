import { Hono } from 'hono';

type Env = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, name FROM categories ORDER BY name COLLATE NOCASE ASC',
    ).all<{ id: number; name: string }>();

    return c.json(results ?? []);
  } catch (error) {
    console.error('[categories] failed to fetch categories', error);
    return c.json({ success: false, message: '카테고리를 불러오지 못했습니다.' }, 500);
  }
});

export default app;
