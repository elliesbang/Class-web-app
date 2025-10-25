import { Hono } from 'hono';

const app = new Hono();

app.get('/', async (c) => {
  const db = c.env.DB;
  try {
    const { results } = await db.prepare("SELECT id, name, categoryId FROM classes ORDER BY id ASC").all();
    return c.json(results);
  } catch (err) {
    console.error("❌ D1 쿼리 오류:", err);
    return c.json({ error: "DB 조회 실패" }, 500);
  }
});

export default app;
