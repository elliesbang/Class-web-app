const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const handleError = (error) => {
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  const status = typeof error?.status === 'number' ? error.status : 500;
  console.error('[Class API Error]', message);
  return json({ success: false, message }, status);
};

const toTrimmedStringOrNull = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
};

const toIntegerOrNull = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
};

const normalisePayload = (input = {}) => {
  if (typeof input !== 'object' || input === null) {
    return {
      name: null,
      category_id: null,
      start_date: null,
      end_date: null,
      upload_limit: null,
      upload_day: null,
      code: null,
      category: null,
      duration: null,
    };
  }

  return {
    name: toTrimmedStringOrNull(input.name ?? input.class_name),
    category_id: toIntegerOrNull(input.category_id ?? input.categoryId),
    start_date: toTrimmedStringOrNull(input.start_date ?? input.startDate),
    end_date: toTrimmedStringOrNull(input.end_date ?? input.endDate),
    upload_limit: toTrimmedStringOrNull(input.upload_limit ?? input.uploadLimit),
    upload_day: toTrimmedStringOrNull(input.upload_day ?? input.uploadDay),
    code: toTrimmedStringOrNull(input.code ?? input.class_code ?? input.classCode),
    category: toTrimmedStringOrNull(input.category ?? input.class_category ?? input.classCategory),
    duration: toTrimmedStringOrNull(input.duration ?? input.class_duration ?? input.classDuration),
  };
};

const buildInsertStatement = (db, payload) => {
  const columns = [
    'name',
    'category_id',
    'start_date',
    'end_date',
    'upload_limit',
    'upload_day',
    'code',
    'category',
    'duration',
  ];

  const placeholders = columns.map((_, index) => `?${index + 1}`).join(', ');
  const values = columns.map((column) => payload[column] ?? null);

  const statement = db.prepare(
    `INSERT INTO classes (${columns.join(', ')}) VALUES (${placeholders})`,
  );

  return { statement, values };
};

export const onRequestPost = async ({ request, env }) => {
  try {
    if (!env || !env.DB) {
      throw new Error('Database binding "DB" is not configured.');
    }

    const body = await request.json().catch(() => ({}));
    const payload = normalisePayload(body);

    if (!payload.name) {
      const error = new Error('The "name" field is required.');
      error.status = 400;
      throw error;
    }

    const { statement, values } = buildInsertStatement(env.DB, payload);
    await statement.bind(...values).run();

    return json({ success: true, message: 'Class created successfully' }, 201);
  } catch (error) {
    return handleError(error);
  }
};

export const onRequestGet = async ({ env }) => {
  try {
    if (!env || !env.DB) {
      throw new Error('Database binding "DB" is not configured.');
    }

    const query = `
      SELECT 
        id,
        name,
        category_id,
        start_date,
        end_date,
        upload_limit,
        upload_day,
        code,
        created_at,
        category,
        duration
      FROM classes
      ORDER BY id DESC
    `;

    const { results } = await env.DB.prepare(query).all();

    return json(results || []);
  } catch (error) {
    return handleError(error);
  }
};
