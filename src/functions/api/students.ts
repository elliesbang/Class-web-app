import { Hono } from 'hono';
import { ensureBaseSchema } from '../../../functions/api/_utils';

interface Env {
  DB: D1Database;
}

type UploadRequestBody = {
  classId?: unknown;
  class_id?: unknown;
  students?: unknown;
};

type StudentPayload = {
  name: string;
  email: string;
};

const normaliseEmail = (value: string) => value.trim().toLowerCase();
const normaliseName = (value: string) => value.trim();

const app = new Hono<{ Bindings: Env }>();

app.post('/', async (c) => {
  try {
    const body = (await c.req.json()) as UploadRequestBody;
    const classIdInput = body.classId ?? body.class_id;
    const classId = Number(classIdInput);

    if (Number.isNaN(classId) || classId <= 0) {
      return c.json({ success: false, message: '유효한 class_id가 필요합니다.' }, 400);
    }

    const studentsInput = Array.isArray(body.students) ? (body.students as unknown[]) : [];
    const students: StudentPayload[] = studentsInput
      .map((student) => {
        if (!student || typeof student !== 'object') {
          return null;
        }

        const { name, email } = student as { name?: unknown; email?: unknown };
        if (typeof name !== 'string' || typeof email !== 'string') {
          return null;
        }

        const normalisedName = normaliseName(name);
        const normalisedEmail = normaliseEmail(email);
        if (normalisedName.length === 0 || normalisedEmail.length === 0) {
          return null;
        }

        return { name: normalisedName, email: normalisedEmail } satisfies StudentPayload;
      })
      .filter((student): student is StudentPayload => student !== null);

    if (students.length === 0) {
      return c.json({ success: false, message: '업로드할 수 있는 수강생 정보가 없습니다.' }, 400);
    }

    await ensureBaseSchema(c.env.DB);

    const classExists = await c.env.DB.prepare('SELECT id FROM classes WHERE id = ?1').bind(classId).first<{ id: number }>();
    if (!classExists) {
      return c.json({ success: false, message: '존재하지 않는 클래스입니다.' }, 404);
    }

    const statements = students.map((student) =>
      c.env.DB.prepare('INSERT OR IGNORE INTO students (name, email, class_id) VALUES (?1, ?2, ?3)').bind(
        student.name,
        student.email,
        classId,
      ),
    );

    const results = await c.env.DB.batch(statements);
    const insertedCount = results.reduce((total, result) => total + (result.meta?.changes ?? 0), 0);

    return c.json({
      success: true,
      message: '수강생 명단 업로드 완료',
      data: { classId, insertedCount, total: students.length },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return c.json({ success: false, message }, 500);
  }
});

export default app;
