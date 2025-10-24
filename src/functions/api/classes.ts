import { Hono } from 'hono';

type Env = {
  DB: D1Database;
};

const CATEGORY_OPTIONS = ['이얼챌', '캔디마', '나캔디', '캔디수', '미치나', '나컬작'];
const WEEKDAY_OPTIONS = ['월', '화', '수', '목', '금', '토', '일'];
const ALLOWED_ASSIGNMENT_TIMES = new Set(['all_day', 'same_day']);
const CODE_PATTERN = /^CL-\d{4}-[A-Z0-9]{4}$/;

const toUniqueSortedDays = (input: string[]) => {
  const set = new Set(input);
  return WEEKDAY_OPTIONS.filter((day) => set.has(day));
};

const parseJsonArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : item == null ? '' : String(item).trim()))
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parseJsonArray(parsed);
      }
    } catch (error) {
      // ignore parse error and fall back to comma separated string
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
};

const ensureClassesTable = async (db: D1Database) => {
  const existing = await db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='classes'")
    .first<{ name: string }>();

  if (!existing) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT,
        assignment_upload_time TEXT NOT NULL,
        assignment_upload_days TEXT NOT NULL,
        delivery_methods TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_code ON classes(code)');
    return;
  }

  const { results } = await db.prepare('PRAGMA table_info(classes)').all<{ name: string }>();
  const columns = new Set(results?.map((row) => row.name) ?? []);

  const addColumn = async (name: string, ddl: string, postUpdate?: () => Promise<void>) => {
    if (!columns.has(name)) {
      await db.exec(ddl);
      if (postUpdate) {
        await postUpdate();
      }
      columns.add(name);
    }
  };

  await addColumn('code', 'ALTER TABLE classes ADD COLUMN code TEXT', async () => {
    await db.exec(
      "UPDATE classes SET code = COALESCE(code, '') WHERE code IS NULL OR TRIM(code) = ''",
    );
    await db.exec(
      "UPDATE classes SET code = CASE WHEN TRIM(code) = '' THEN 'CL-' || strftime('%Y', 'now') || '-' || substr(hex(randomblob(4)), 1, 4) ELSE UPPER(code) END",
    );
  });
  await addColumn('category', 'ALTER TABLE classes ADD COLUMN category TEXT', async () => {
    await db.exec("UPDATE classes SET category = COALESCE(NULLIF(TRIM(category), ''), '기타')");
  });
  await addColumn('start_date', 'ALTER TABLE classes ADD COLUMN start_date TEXT');
  await addColumn('end_date', 'ALTER TABLE classes ADD COLUMN end_date TEXT');
  await addColumn('assignment_upload_time', 'ALTER TABLE classes ADD COLUMN assignment_upload_time TEXT', async () => {
    await db.exec("UPDATE classes SET assignment_upload_time = COALESCE(NULLIF(TRIM(assignment_upload_time), ''), 'all_day')");
  });
  await addColumn('assignment_upload_days', 'ALTER TABLE classes ADD COLUMN assignment_upload_days TEXT', async () => {
    await db.exec(
      "UPDATE classes SET assignment_upload_days = COALESCE(NULLIF(TRIM(assignment_upload_days), ''), '[\"월\",\"화\",\"수\",\"목\",\"금\",\"토\",\"일\"]')",
    );
  });
  await addColumn('delivery_methods', 'ALTER TABLE classes ADD COLUMN delivery_methods TEXT', async () => {
    await db.exec(
      "UPDATE classes SET delivery_methods = COALESCE(NULLIF(TRIM(delivery_methods), ''), '[\"영상보기\"]')",
    );
  });
  await addColumn('is_active', 'ALTER TABLE classes ADD COLUMN is_active INTEGER DEFAULT 1', async () => {
    await db.exec('UPDATE classes SET is_active = COALESCE(is_active, 1)');
  });
  await addColumn('created_at', 'ALTER TABLE classes ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP', async () => {
    await db.exec('UPDATE classes SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP)');
  });
  await addColumn('updated_at', 'ALTER TABLE classes ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP', async () => {
    await db.exec('UPDATE classes SET updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)');
  });

  await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_code ON classes(code)');
};

const parseDateInput = (value: unknown) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return trimmed;
  }
  return null;
};

const parseClassPayload = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return { ok: false as const, message: '유효한 수업 정보를 전달해주세요.' };
  }

  const record = payload as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  if (!name) {
    return { ok: false as const, message: '수업명을 입력해주세요.' };
  }

  const rawCode = typeof record.code === 'string' ? record.code.trim().toUpperCase() : '';
  if (!rawCode) {
    return { ok: false as const, message: '수업 코드를 입력해주세요.' };
  }
  if (!CODE_PATTERN.test(rawCode)) {
    return { ok: false as const, message: '수업 코드는 CL-연도-랜덤4자리 형식이어야 합니다.' };
  }

  const rawCategory = typeof record.category === 'string' ? record.category.trim() : '';
  if (!rawCategory) {
    return { ok: false as const, message: '카테고리를 선택해주세요.' };
  }

  const category = CATEGORY_OPTIONS.includes(rawCategory) ? rawCategory : rawCategory;

  const startDate = parseDateInput(record.startDate ?? record.start_date);
  const endDate = parseDateInput(record.endDate ?? record.end_date);
  if (startDate && endDate && startDate > endDate) {
    return { ok: false as const, message: '종료일은 시작일 이후여야 합니다.' };
  }

  const timeValue = typeof record.assignmentUploadTime === 'string'
    ? record.assignmentUploadTime
    : typeof record.assignment_upload_time === 'string'
    ? record.assignment_upload_time
    : 'all_day';
  const normalisedTime = timeValue.trim().toLowerCase();
  const assignmentUploadTime = ALLOWED_ASSIGNMENT_TIMES.has(normalisedTime)
    ? (normalisedTime as 'all_day' | 'same_day')
    : normalisedTime === 'day_only' || normalisedTime === 'single_day'
    ? 'same_day'
    : 'all_day';

  const daysInput = record.assignmentUploadDays ?? record.assignment_upload_days;
  const parsedDays = toUniqueSortedDays(parseJsonArray(daysInput));
  if (parsedDays.length === 0) {
    return { ok: false as const, message: '과제 업로드 가능 요일을 선택해주세요.' };
  }

  const deliveryInput = record.deliveryMethods ?? record.delivery_methods;
  const parsedDelivery = Array.from(new Set(parseJsonArray(deliveryInput)));
  if (parsedDelivery.length === 0) {
    return { ok: false as const, message: '수강 방식을 한 가지 이상 선택해주세요.' };
  }

  const isActiveRaw = record.isActive ?? record.is_active;
  const isActive = typeof isActiveRaw === 'boolean' ? isActiveRaw : Number(isActiveRaw) !== 0;

  const cleanedDelivery = parsedDelivery.map((item) => item.trim()).filter((item) => item.length > 0);

  if (cleanedDelivery.length === 0) {
    return { ok: false as const, message: '수강 방식을 한 가지 이상 선택해주세요.' };
  }

  return {
    ok: true as const,
    value: {
      name,
      code: rawCode,
      category,
      startDate,
      endDate,
      assignmentUploadTime,
      assignmentUploadDays: parsedDays,
      deliveryMethods: cleanedDelivery,
      isActive,
    },
  };
};

const mapRow = (row: Record<string, unknown>) => {
  const assignmentDays = toUniqueSortedDays(parseJsonArray(row.assignment_upload_days));
  const deliveryMethods = Array.from(new Set(parseJsonArray(row.delivery_methods)));

  const timeValue = typeof row.assignment_upload_time === 'string' ? row.assignment_upload_time.trim().toLowerCase() : 'all_day';
  const assignmentUploadTime = ALLOWED_ASSIGNMENT_TIMES.has(timeValue)
    ? timeValue
    : timeValue === 'day_only' || timeValue === 'single_day'
    ? 'same_day'
    : 'all_day';

  return {
    id: Number(row.id),
    name: typeof row.name === 'string' ? row.name.trim() : row.name,
    code: typeof row.code === 'string' ? row.code.trim().toUpperCase() : row.code,
    category: typeof row.category === 'string' ? row.category.trim() : row.category,
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    assignmentUploadTime,
    assignmentUploadDays: assignmentDays,
    deliveryMethods,
    isActive: Number(row.is_active) !== 0,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
};

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
  try {
    await ensureClassesTable(c.env.DB);
    const { results } = await c.env.DB.prepare(
      'SELECT id, name, code, category, start_date, end_date, assignment_upload_time, assignment_upload_days, delivery_methods, is_active, created_at, updated_at FROM classes ORDER BY name COLLATE NOCASE ASC',
    ).all<Record<string, unknown>>();

    const data = (results ?? []).map((row) => mapRow(row));
    return c.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return c.json({ success: false, message }, 500);
  }
});

app.post('/', async (c) => {
  try {
    await ensureClassesTable(c.env.DB);

    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch (error) {
      return c.json({ success: false, message: '유효한 JSON 본문을 전달해주세요.' }, 400);
    }

    const parsed = parseClassPayload(payload);
    if (!parsed.ok) {
      return c.json({ success: false, message: parsed.message }, 400);
    }

    const value = parsed.value;

    const inserted = await c.env.DB
      .prepare(
        `INSERT INTO classes (name, code, category, start_date, end_date, assignment_upload_time, assignment_upload_days, delivery_methods, is_active, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id, name, code, category, start_date, end_date, assignment_upload_time, assignment_upload_days, delivery_methods, is_active, created_at, updated_at`,
      )
      .bind(
        value.name,
        value.code,
        value.category,
        value.startDate,
        value.endDate,
        value.assignmentUploadTime,
        JSON.stringify(value.assignmentUploadDays),
        JSON.stringify(value.deliveryMethods),
        value.isActive ? 1 : 0,
      )
      .first<Record<string, unknown>>();

    if (!inserted) {
      return c.json({ success: true, data: [] }, 201);
    }

    return c.json({ success: true, data: [mapRow(inserted)] }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    const status = message.includes('UNIQUE constraint failed') ? 409 : 500;
    const friendlyMessage = status === 409 ? '이미 동일한 수업명 또는 수업 코드가 존재합니다. 다른 값을 사용해주세요.' : message;
    return c.json({ success: false, message: friendlyMessage }, status);
  }
});

app.put('/:id', async (c) => {
  try {
    await ensureClassesTable(c.env.DB);
    const id = Number(c.req.param('id'));
    if (!Number.isFinite(id)) {
      return c.json({ success: false, message: '유효한 수업 ID를 전달해주세요.' }, 400);
    }

    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch (error) {
      return c.json({ success: false, message: '유효한 JSON 본문을 전달해주세요.' }, 400);
    }

    const parsed = parseClassPayload(payload);
    if (!parsed.ok) {
      return c.json({ success: false, message: parsed.message }, 400);
    }

    const existing = await c.env.DB
      .prepare('SELECT id FROM classes WHERE id = ?1')
      .bind(id)
      .first<{ id: number }>();

    if (!existing) {
      return c.json({ success: false, message: '해당 수업을 찾을 수 없습니다.' }, 404);
    }

    const value = parsed.value;

    const updated = await c.env.DB
      .prepare(
        `UPDATE classes
         SET name = ?1,
             code = ?2,
             category = ?3,
             start_date = ?4,
             end_date = ?5,
             assignment_upload_time = ?6,
             assignment_upload_days = ?7,
             delivery_methods = ?8,
             is_active = ?9,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?10
         RETURNING id, name, code, category, start_date, end_date, assignment_upload_time, assignment_upload_days, delivery_methods, is_active, created_at, updated_at`,
      )
      .bind(
        value.name,
        value.code,
        value.category,
        value.startDate,
        value.endDate,
        value.assignmentUploadTime,
        JSON.stringify(value.assignmentUploadDays),
        JSON.stringify(value.deliveryMethods),
        value.isActive ? 1 : 0,
        id,
      )
      .first<Record<string, unknown>>();

    if (!updated) {
      return c.json({ success: false, message: '수업 정보를 업데이트하지 못했습니다.' }, 500);
    }

    return c.json({ success: true, data: [mapRow(updated)] });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    const status = message.includes('UNIQUE constraint failed') ? 409 : 500;
    const friendlyMessage = status === 409 ? '이미 동일한 수업명 또는 수업 코드가 존재합니다. 다른 값을 사용해주세요.' : message;
    return c.json({ success: false, message: friendlyMessage }, status);
  }
});

app.delete('/:id', async (c) => {
  try {
    await ensureClassesTable(c.env.DB);
    const id = Number(c.req.param('id'));
    if (!Number.isFinite(id)) {
      return c.json({ success: false, message: '유효한 수업 ID를 전달해주세요.' }, 400);
    }

    const existing = await c.env.DB
      .prepare('SELECT id, name FROM classes WHERE id = ?1')
      .bind(id)
      .first<{ id: number; name: string }>();

    if (!existing) {
      return c.json({ success: false, message: '해당 수업을 찾을 수 없습니다.' }, 404);
    }

    await c.env.DB.prepare('DELETE FROM classes WHERE id = ?1').bind(id).run();
    return c.json({ success: true, message: '수업이 삭제되었습니다.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return c.json({ success: false, message }, 500);
  }
});

export default app;
