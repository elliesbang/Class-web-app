import { Hono } from 'hono';
import { z } from 'zod';

const app = new Hono();

const optionalTextSchema = z
  .preprocess((value) => {
    if (value == null) {
      return null;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      const stringified = String(value).trim();
      return stringified.length > 0 ? stringified : null;
    }
    return null;
  }, z.string().optional().nullable());

const CourseSchema = z.object({
  name: z
    .string({ required_error: 'Course name is required' })
    .trim()
    .min(1, 'Course name is required'),
  category_id: z.preprocess((value) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : value;
  }, z.number({ invalid_type_error: 'A valid category is required' }).int()),
  type: optionalTextSchema.optional().nullable(),
  upload_limit: optionalTextSchema.optional().nullable(),
});

const normaliseCourseRow = (row) => {
  if (!row || typeof row !== 'object') {
    return null;
  }

  const record = row;
  const toNullableString = (value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    if (value == null) {
      return null;
    }
    return String(value).trim();
  };

  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const id = toNumber(record.id);
  const categoryId = toNumber(record.category_id);
  const rawName = record.name;
  const name =
    typeof rawName === 'string'
      ? rawName.trim()
      : rawName == null
      ? ''
      : String(rawName).trim();

  if (id == null || Number.isNaN(id) || name.length === 0) {
    return null;
  }

  return {
    id,
    name,
    category_id: categoryId,
    category_name: toNullableString(record.category_name),
    type: toNullableString(record.type),
    upload_limit: toNullableString(record.upload_limit),
  };
};

const requireAdmin = (c) => {
  const token = c.req.header('Authorization');
  if (!c.env?.ADMIN_TOKEN || token !== `Bearer ${c.env.ADMIN_TOKEN}`) {
    return c.json({ success: false, message: 'Invalid token' }, 401);
  }
  return null;
};

const fetchCourseById = async (db, id) => {
  const row = await db
    .prepare(
      `SELECT c.id, c.name, c.category_id, c.type, c.upload_limit, cat.name AS category_name
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.id = ?`,
    )
    .bind(id)
    .first();
  return normaliseCourseRow(row);
};

app.get('/api/courses', async (c) => {
  try {
    const { results } = await c.env.DB
      .prepare(
        `SELECT c.id, c.name, c.category_id, c.type, c.upload_limit, cat.name AS category_name
         FROM courses c
         LEFT JOIN categories cat ON c.category_id = cat.id
         ORDER BY c.id DESC`,
      )
      .all();

    const data = (results ?? []).map(normaliseCourseRow).filter((item) => item !== null);

    return c.json({ success: true, data });
  } catch (error) {
    console.error('[courses] Failed to fetch courses', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch courses';
    return c.json({ success: false, message }, 500);
  }
});

app.get('/api/courses/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    if (Number.isNaN(id)) {
      return c.json({ success: false, message: 'Invalid course id' }, 400);
    }

    const course = await fetchCourseById(c.env.DB, id);
    if (!course) {
      return c.json({ success: false, message: 'Course not found' }, 404);
    }

    return c.json({ success: true, data: course });
  } catch (error) {
    console.error('[courses] Failed to fetch course', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch course';
    return c.json({ success: false, message }, 500);
  }
});

app.post('/api/courses', async (c) => {
  try {
    const authError = requireAdmin(c);
    if (authError) {
      return authError;
    }

    let payload;
    try {
      payload = await c.req.json();
    } catch (error) {
      console.error('[courses] Invalid JSON payload', error);
      return c.json({ success: false, message: 'Invalid JSON body' }, 400);
    }

    let parsed;
    try {
      parsed = CourseSchema.parse(payload);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issue = error.issues[0]?.message ?? 'Invalid course payload';
        return c.json({ success: false, message: issue }, 400);
      }
      throw error;
    }

    const statement = c.env.DB
      .prepare('INSERT INTO courses (name, category_id, type, upload_limit) VALUES (?, ?, ?, ?)')
      .bind(parsed.name, parsed.category_id, parsed.type ?? null, parsed.upload_limit ?? null);

    const result = await statement.run();
    const insertedId = result.meta?.last_row_id ?? result.lastRowId;

    if (insertedId == null) {
      return c.json({ success: false, message: 'Failed to create course' }, 500);
    }

    const course = await fetchCourseById(c.env.DB, insertedId);

    return c.json({ success: true, data: course, id: insertedId });
  } catch (error) {
    console.error('[courses] Failed to create course', error);
    const message = error instanceof Error ? error.message : 'Failed to create course';
    return c.json({ success: false, message }, 500);
  }
});

app.put('/api/courses/:id', async (c) => {
  try {
    const authError = requireAdmin(c);
    if (authError) {
      return authError;
    }

    const id = Number(c.req.param('id'));
    if (Number.isNaN(id)) {
      return c.json({ success: false, message: 'Invalid course id' }, 400);
    }

    const existing = await fetchCourseById(c.env.DB, id);
    if (!existing) {
      return c.json({ success: false, message: 'Course not found' }, 404);
    }

    let payload;
    try {
      payload = await c.req.json();
    } catch (error) {
      console.error('[courses] Invalid JSON payload', error);
      return c.json({ success: false, message: 'Invalid JSON body' }, 400);
    }

    let parsed;
    try {
      parsed = CourseSchema.parse(payload);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issue = error.issues[0]?.message ?? 'Invalid course payload';
        return c.json({ success: false, message: issue }, 400);
      }
      throw error;
    }

    await c.env.DB
      .prepare('UPDATE courses SET name = ?, category_id = ?, type = ?, upload_limit = ? WHERE id = ?')
      .bind(parsed.name, parsed.category_id, parsed.type ?? null, parsed.upload_limit ?? null, id)
      .run();

    const course = await fetchCourseById(c.env.DB, id);

    return c.json({ success: true, data: course });
  } catch (error) {
    console.error('[courses] Failed to update course', error);
    const message = error instanceof Error ? error.message : 'Failed to update course';
    return c.json({ success: false, message }, 500);
  }
});

app.delete('/api/courses/:id', async (c) => {
  try {
    const authError = requireAdmin(c);
    if (authError) {
      return authError;
    }

    const id = Number(c.req.param('id'));
    if (Number.isNaN(id)) {
      return c.json({ success: false, message: 'Invalid course id' }, 400);
    }

    const existing = await c.env.DB
      .prepare('SELECT id FROM courses WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return c.json({ success: false, message: 'Course not found' }, 404);
    }

    await c.env.DB.prepare('DELETE FROM courses WHERE id = ?').bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('[courses] Failed to delete course', error);
    const message = error instanceof Error ? error.message : 'Failed to delete course';
    return c.json({ success: false, message }, 500);
  }
});

export default app;
