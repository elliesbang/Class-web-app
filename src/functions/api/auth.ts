import { Hono } from 'hono';
import { ensureBaseSchema } from '../../../functions/api/_utils';

interface Env {
  DB: D1Database;
}

type AuthRequestBody = {
  name?: unknown;
  email?: unknown;
};

type AuthRow = {
  class_id: number;
  class_name: string;
};

const normaliseEmail = (value: string) => value.trim().toLowerCase();
const normaliseName = (value: string) => value.trim();

const app = new Hono<{ Bindings: Env }>();

app.post('/', async (c) => {
  try {
    const body = (await c.req.json()) as AuthRequestBody;
    const nameInput = typeof body.name === 'string' ? normaliseName(body.name) : '';
    const emailInput = typeof body.email === 'string' ? normaliseEmail(body.email) : '';

    if (nameInput.length === 0 || emailInput.length === 0) {
      return c.json({ success: false, message: '이름과 이메일을 모두 입력해주세요.' }, 400);
    }

    await ensureBaseSchema(c.env.DB);

    const query = `
      SELECT s.class_id, c.name AS class_name
      FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.name = ?1 AND s.email = ?2
      ORDER BY s.created_at ASC
    `;

    const { results } = await c.env.DB.prepare(query).bind(nameInput, emailInput).all<AuthRow>();
    const rows = results ?? [];

    if (rows.length === 0) {
      return c.json({ success: false, message: '등록된 수강 내역이 없습니다.' }, 200);
    }

    const data = rows
      .map((row) => {
        const classId = Number(row.class_id);
        const className = typeof row.class_name === 'string' ? row.class_name : '';

        if (Number.isNaN(classId) || className.trim().length === 0) {
          return null;
        }

        return {
          classId,
          className: className.trim(),
        };
      })
      .filter((row): row is { classId: number; className: string } => row !== null);

    if (data.length === 0) {
      return c.json({ success: false, message: '수강 중인 클래스를 확인할 수 없습니다.' }, 200);
    }

    return c.json({ success: true, message: '인증 성공', data });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return c.json({ success: false, message }, 500);
  }
});

export default app;
