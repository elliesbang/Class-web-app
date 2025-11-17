import { Hono } from 'hono';

export const students = new Hono();

students.get('/', async (c) => {
  const db = c.env.DB; // D1 binding

  const result = await db.prepare(`
    SELECT
      s.id,
      s.name,
      s.email,
      COALESCE(c.name, '미지정') AS courseName,
      e.enrolled_at AS registeredAt,
      '정상' AS status
    FROM student_account s
    LEFT JOIN student_class_enrollment e ON e.student_id = s.id
    LEFT JOIN classroom c ON c.id = e.class_id
    ORDER BY s.name ASC
  `).all();

  return c.json(result.results ?? []);
});

students.get('/vod', async (c) => {
  const db = c.env.DB;

  const result = await db.prepare(`
    SELECT
      v.id,
      v.name,
      v.email,
      '정상' AS status,
      v.access_level AS vodAccess,
      v.subscription_end AS subscriptionEndsAt
    FROM vod_account v
    ORDER BY v.name ASC
  `).all();

  return c.json(result.results ?? []);
});

export default students;
