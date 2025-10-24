import { Hono } from 'hono';

type Env = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

const COURSE_CODE_RANDOM_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const COURSE_CODE_RANDOM_LENGTH = 5;
const COURSE_CODE_PREFIX_LENGTH = 7;

const generateCourseCode = (courseName: string, generation: string) => {
  const baseName = courseName.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const prefixSource = baseName.length > 0 ? baseName : 'COURSE';
  const prefix = prefixSource.slice(0, COURSE_CODE_PREFIX_LENGTH);

  const generationSegment = (() => {
    const rawGeneration = generation.trim();
    if (/^\d+$/.test(rawGeneration)) {
      return rawGeneration.padStart(2, '0');
    }
    return rawGeneration.toUpperCase();
  })();

  const randomSegment = Array.from({ length: COURSE_CODE_RANDOM_LENGTH }, () => {
    const index = Math.floor(Math.random() * COURSE_CODE_RANDOM_CHARSET.length);
    return COURSE_CODE_RANDOM_CHARSET[index];
  }).join('');

  return `${prefix}-${generationSegment}-${randomSegment}`;
};

app.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      course_name?: unknown;
      generation?: unknown;
      start_date?: unknown;
      end_date?: unknown;
    }>();

    const courseName = typeof body.course_name === 'string' ? body.course_name.trim() : '';
    const generation = typeof body.generation === 'string' ? body.generation.trim() : '';
    const startDate = typeof body.start_date === 'string' ? body.start_date.trim() : '';
    const endDate = typeof body.end_date === 'string' ? body.end_date.trim() : '';

    if (!courseName || !generation || !startDate || !endDate) {
      return c.json({ message: 'Error creating course' }, 500);
    }

    const courseCode = generateCourseCode(courseName, generation);

    await c.env.DB.prepare(
      `INSERT INTO courses (course_name, generation, course_code, start_date, end_date, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))`,
    )
      .bind(courseName, generation, courseCode, startDate, endDate)
      .run();

    return c.json({ message: 'Course created successfully', course_code: courseCode });
  } catch (error) {
    console.error('[courses] Failed to create course', error);
    return c.json({ message: 'Error creating course' }, 500);
  }
});

export default app;
