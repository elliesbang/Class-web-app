import { Hono } from 'hono';

const VALID_WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

const toNonEmptyString = (value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return null;
};

const toNullableString = (value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    const stringified = String(value).trim();
    return stringified.length > 0 ? stringified : null;
  }

  return null;
};

const toNullableDate = (value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }
    return trimmed;
  }

  return null;
};

const parseBooleanFlag = (value, fallback) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (normalised.length === 0) {
      return fallback;
    }

    if (['1', 'true', 'y', 'yes', 'on'].includes(normalised)) {
      return true;
    }

    if (['0', 'false', 'n', 'no', 'off'].includes(normalised)) {
      return false;
    }
  }

  return fallback;
};

const toStringArray = (value) => {
  if (Array.isArray(value)) {
    const seen = new Set();
    const filtered = [];

    for (const item of value) {
      const normalised = typeof item === 'string' ? item.trim() : item == null ? '' : String(item).trim();
      if (normalised.length === 0 || seen.has(normalised)) {
        continue;
      }
      seen.add(normalised);
      filtered.push(normalised);
    }

    return filtered;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return toStringArray(parsed);
      }
    } catch {
      // ignore JSON parse errors and fallback to comma separated values
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (value == null) {
    return [];
  }

  return toStringArray(String(value));
};

const parseStoredArray = (value) => {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return toStringArray(value);
  }

  if (typeof value === 'object') {
    try {
      const parsed = JSON.parse(JSON.stringify(value));
      if (Array.isArray(parsed)) {
        return toStringArray(parsed);
      }
    } catch {
      // ignore
    }
  }

  return toStringArray(value);
};

const filterValidDays = (input) => {
  const valid = new Set(VALID_WEEKDAYS);
  const seen = new Set();
  const filtered = [];

  for (const day of input) {
    if (valid.has(day) && !seen.has(day)) {
      seen.add(day);
      filtered.push(day);
    }
  }

  return filtered;
};

const normaliseAssignmentDays = (value, fallback) => {
  if (value === undefined) {
    return [...fallback];
  }

  const parsed = filterValidDays(toStringArray(value));
  return parsed.length > 0 ? parsed : [...fallback];
};

const normaliseDeliveryMethods = (value, fallback) => {
  if (value === undefined) {
    return [...fallback];
  }

  const parsed = toStringArray(value);
  return parsed.length > 0 ? parsed : [...fallback];
};

const normaliseAssignmentUploadTime = (value, fallback) => {
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (normalised === 'same_day' || normalised === 'day_only' || normalised === 'single_day') {
      return 'same_day';
    }
    if (normalised === 'all_day') {
      return 'all_day';
    }
  }

  if (value === 'same_day') {
    return 'same_day';
  }

  return fallback;
};

const getClassTableColumns = async (db) => {
  const { results } = await db.prepare("PRAGMA table_info('classes')").all();

  const columns = new Set();
  for (const row of results ?? []) {
    if (row && typeof row.name === 'string') {
      columns.add(row.name.toLowerCase());
    }
  }

  return columns;
};

const trySelectWithCategory = async (db, columns) => {
  if (!columns.has('category_id')) {
    return null;
  }

  try {
    const { results } = await db
      .prepare(
        `SELECT c.*, cat.name AS category_name
         FROM classes c
         LEFT JOIN categories cat ON c.category_id = cat.id
         ORDER BY c.created_at DESC, c.updated_at DESC, c.id DESC`,
      )
      .all();

    return results ?? [];
  } catch (error) {
    console.warn('[classes] Failed to join categories table:', error);
    return null;
  }
};

const fetchClassRows = async (db, columns) => {
  const joined = await trySelectWithCategory(db, columns);
  if (joined) {
    return joined;
  }

  const { results } = await db
    .prepare('SELECT * FROM classes ORDER BY created_at DESC, updated_at DESC, id DESC')
    .all();

  return results ?? [];
};

const resolveCategoryId = async (db, name) => {
  if (!name) {
    return null;
  }

  try {
    const row = await db
      .prepare('SELECT id FROM categories WHERE name = ? LIMIT 1')
      .bind(name)
      .first();
    return row && typeof row.id === 'number' ? row.id : null;
  } catch (error) {
    console.warn('[classes] Failed to resolve category id:', error);
    return null;
  }
};

const parseDateColumn = (row, ...keys) => {
  for (const key of keys) {
    if (!(key in row)) {
      continue;
    }
    const parsed = toNullableDate(row[key]);
    if (parsed) {
      return parsed;
    }
  }
  return null;
};

const parseStringColumn = (row, ...keys) => {
  for (const key of keys) {
    if (!(key in row)) {
      continue;
    }
    const parsed = toNullableString(row[key]);
    if (parsed !== null) {
      return parsed;
    }
  }
  return '';
};

const getRowValue = (row, ...keys) => {
  for (const key of keys) {
    if (key in row) {
      return row[key];
    }
  }
  return undefined;
};

const toClassPayload = (row) => {
  const id = Number(row.id);
  const name = toNonEmptyString(row.name) ?? '';

  const code = parseStringColumn(row, 'code', 'class_code');
  const category = parseStringColumn(row, 'category', 'category_name', 'categoryName');
  const startDate = parseDateColumn(row, 'start_date', 'startDate');
  const endDate = parseDateColumn(row, 'end_date', 'endDate');

  const assignmentUploadTime = normaliseAssignmentUploadTime(
    getRowValue(row, 'assignment_upload_time', 'assignmentUploadTime', 'upload_limit', 'uploadLimit'),
    'all_day',
  );

  const assignmentDays = filterValidDays(
    parseStoredArray(
      getRowValue(
        row,
        'assignment_upload_days',
        'assignmentUploadDays',
        'assignment_submission_days',
        'assignmentSubmissionDays',
        'upload_day',
        'uploadDay',
      ),
    ),
  );

  const deliveryMethods = parseStoredArray(getRowValue(row, 'delivery_methods', 'deliveryMethods'));

  const isActive = parseBooleanFlag(getRowValue(row, 'is_active', 'isActive', 'active', 'status'), true);

  const createdAt = parseDateColumn(row, 'created_at', 'createdAt');
  const updatedAt = parseDateColumn(row, 'updated_at', 'updatedAt');

  return {
    id,
    name,
    code: code ?? '',
    category: category ?? '',
    startDate,
    endDate,
    assignmentUploadTime,
    assignmentUploadDays: assignmentDays.length > 0 ? assignmentDays : [...VALID_WEEKDAYS],
    deliveryMethods: deliveryMethods.length > 0 ? deliveryMethods : ['영상보기'],
    isActive,
    createdAt,
    updatedAt,
  };
};

const buildInsertStatement = async (db, columns, payload) => {
  const fields = ['name'];
  const placeholders = ['?'];
  const values = [payload.name];

  const pushField = (column, value) => {
    fields.push(column);
    placeholders.push('?');
    values.push(value);
  };

  if (columns.has('code')) {
    pushField('code', payload.code);
  }

  if (columns.has('category')) {
    pushField('category', payload.category);
  }

  if (columns.has('category_id')) {
    const categoryId = await resolveCategoryId(db, payload.category);
    pushField('category_id', categoryId);
  }

  if (columns.has('start_date')) {
    pushField('start_date', payload.startDate);
  }

  if (columns.has('end_date')) {
    pushField('end_date', payload.endDate);
  }

  if (columns.has('assignment_upload_time')) {
    pushField('assignment_upload_time', payload.assignmentUploadTime);
  } else if (columns.has('upload_limit')) {
    pushField('upload_limit', payload.assignmentUploadTime);
  }

  const daysJson = JSON.stringify(payload.assignmentUploadDays);
  if (columns.has('assignment_upload_days')) {
    pushField('assignment_upload_days', daysJson);
  } else if (columns.has('upload_day')) {
    pushField('upload_day', payload.assignmentUploadDays.join(','));
  }

  if (columns.has('delivery_methods')) {
    pushField('delivery_methods', JSON.stringify(payload.deliveryMethods));
  }

  if (columns.has('is_active')) {
    pushField('is_active', payload.isActive ? 1 : 0);
  }

  const now = new Date().toISOString();
  if (columns.has('created_at')) {
    pushField('created_at', now);
  }
  if (columns.has('updated_at')) {
    pushField('updated_at', now);
  }

  const sql = `INSERT INTO classes (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;

  return { sql, values };
};

const buildUpdateStatement = async (db, columns, id, payload) => {
  const setClauses = ['name = ?'];
  const values = [payload.name];

  const pushSet = (column, value) => {
    setClauses.push(`${column} = ?`);
    values.push(value);
  };

  if (columns.has('code')) {
    pushSet('code', payload.code);
  }

  if (columns.has('category')) {
    pushSet('category', payload.category);
  }

  if (columns.has('category_id')) {
    const categoryId = await resolveCategoryId(db, payload.category);
    pushSet('category_id', categoryId);
  }

  if (columns.has('start_date')) {
    pushSet('start_date', payload.startDate);
  }

  if (columns.has('end_date')) {
    pushSet('end_date', payload.endDate);
  }

  if (columns.has('assignment_upload_time')) {
    pushSet('assignment_upload_time', payload.assignmentUploadTime);
  } else if (columns.has('upload_limit')) {
    pushSet('upload_limit', payload.assignmentUploadTime);
  }

  const daysJson = JSON.stringify(payload.assignmentUploadDays);
  if (columns.has('assignment_upload_days')) {
    pushSet('assignment_upload_days', daysJson);
  } else if (columns.has('upload_day')) {
    pushSet('upload_day', payload.assignmentUploadDays.join(','));
  }

  if (columns.has('delivery_methods')) {
    pushSet('delivery_methods', JSON.stringify(payload.deliveryMethods));
  }

  if (columns.has('is_active')) {
    pushSet('is_active', payload.isActive ? 1 : 0);
  }

  const now = new Date().toISOString();
  if (columns.has('updated_at')) {
    pushSet('updated_at', now);
  }

  const sql = `UPDATE classes SET ${setClauses.join(', ')} WHERE id = ?`;
  values.push(id);

  return { sql, values };
};

const app = new Hono();

app.get('/', async (c) => {
  try {
    const columns = await getClassTableColumns(c.env.DB);
    const rows = await fetchClassRows(c.env.DB, columns);
    const classes = rows
      .map(toClassPayload)
      .filter((item) => !Number.isNaN(item.id) && item.name.length > 0);

    return c.json({ success: true, data: classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ success: false, message: '수업 목록 불러오기 실패', error: message }, 500);
  }
});

app.post('/', async (c) => {
  try {
    let payload;
    try {
      payload = (await c.req.json()) ?? {};
    } catch {
      return c.json({ success: false, message: '유효한 JSON 본문이 필요합니다.' }, 400);
    }

    const name = toNonEmptyString(payload.name);
    if (!name) {
      return c.json({ success: false, message: '수업 이름은 필수입니다.' }, 400);
    }

    const code = toNullableString(payload.code);
    const category = toNullableString(payload.category);
    const startDate = toNullableDate(payload.startDate);
    const endDate = toNullableDate(payload.endDate);
    const assignmentUploadTime = normaliseAssignmentUploadTime(payload.assignmentUploadTime, 'all_day');
    const assignmentUploadDays = normaliseAssignmentDays(payload.assignmentUploadDays, [...VALID_WEEKDAYS]);
    const deliveryMethods = normaliseDeliveryMethods(payload.deliveryMethods, ['영상보기']);
    const isActive = parseBooleanFlag(payload.isActive, true);

    const columns = await getClassTableColumns(c.env.DB);
    const { sql, values } = await buildInsertStatement(c.env.DB, columns, {
      name,
      code,
      category,
      startDate,
      endDate,
      assignmentUploadTime,
      assignmentUploadDays,
      deliveryMethods,
      isActive,
    });

    const insertResult = await c.env.DB.prepare(sql).bind(...values).run();
    const insertedId = insertResult?.meta?.last_row_id;

    const inserted = await c.env.DB
      .prepare('SELECT * FROM classes WHERE id = ?')
      .bind(insertedId)
      .first();

    if (!inserted) {
      return c.json({ success: false, message: '생성된 수업 정보를 찾을 수 없습니다.' }, 500);
    }

    return c.json({ success: true, data: toClassPayload(inserted) });
  } catch (error) {
    console.error('Error saving class:', error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ success: false, message: '수업 저장 실패', error: message }, 500);
  }
});

app.put('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    if (Number.isNaN(id)) {
      return c.json({ success: false, message: '수정할 수업을 찾을 수 없습니다.' }, 400);
    }

    const existing = await c.env.DB
      .prepare('SELECT * FROM classes WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return c.json({ success: false, message: '수업 정보를 찾을 수 없습니다.' }, 404);
    }

    let payload;
    try {
      payload = (await c.req.json()) ?? {};
    } catch {
      return c.json({ success: false, message: '유효한 JSON 본문이 필요합니다.' }, 400);
    }

    const existingName = toNonEmptyString(existing.name) ?? '';
    const name = toNonEmptyString(payload.name) ?? existingName;

    const existingCode = parseStringColumn(existing, 'code', 'class_code');
    const code = Object.prototype.hasOwnProperty.call(payload, 'code')
      ? toNullableString(payload.code)
      : existingCode;

    const existingCategory = parseStringColumn(existing, 'category', 'category_name', 'categoryName');
    const category = Object.prototype.hasOwnProperty.call(payload, 'category')
      ? toNullableString(payload.category)
      : existingCategory;

    const existingStartDate = parseDateColumn(existing, 'start_date', 'startDate');
    const startDate = Object.prototype.hasOwnProperty.call(payload, 'startDate')
      ? toNullableDate(payload.startDate)
      : existingStartDate;

    const existingEndDate = parseDateColumn(existing, 'end_date', 'endDate');
    const endDate = Object.prototype.hasOwnProperty.call(payload, 'endDate')
      ? toNullableDate(payload.endDate)
      : existingEndDate;

    const existingDays = filterValidDays(
      parseStoredArray(
        getRowValue(
          existing,
          'assignment_upload_days',
          'assignmentUploadDays',
          'assignment_submission_days',
          'assignmentSubmissionDays',
          'upload_day',
          'uploadDay',
        ),
      ),
    );
    const assignmentUploadDays = normaliseAssignmentDays(
      Object.prototype.hasOwnProperty.call(payload, 'assignmentUploadDays') ? payload.assignmentUploadDays : undefined,
      existingDays,
    );

    const existingUploadTime = getRowValue(
      existing,
      'assignment_upload_time',
      'assignmentUploadTime',
      'upload_limit',
      'uploadLimit',
    );
    const assignmentUploadTime = normaliseAssignmentUploadTime(
      Object.prototype.hasOwnProperty.call(payload, 'assignmentUploadTime') ? payload.assignmentUploadTime : existingUploadTime,
      normaliseAssignmentUploadTime(existingUploadTime, 'all_day'),
    );

    const existingDeliveryMethods = parseStoredArray(getRowValue(existing, 'delivery_methods', 'deliveryMethods'));
    const deliveryMethods = normaliseDeliveryMethods(
      Object.prototype.hasOwnProperty.call(payload, 'deliveryMethods') ? payload.deliveryMethods : undefined,
      existingDeliveryMethods.length > 0 ? existingDeliveryMethods : ['영상보기'],
    );

    const existingIsActive = parseBooleanFlag(
      getRowValue(existing, 'is_active', 'isActive', 'active', 'status'),
      true,
    );
    const isActive = parseBooleanFlag(
      Object.prototype.hasOwnProperty.call(payload, 'isActive') ? payload.isActive : existingIsActive,
      existingIsActive,
    );

    const columns = await getClassTableColumns(c.env.DB);
    const { sql, values } = await buildUpdateStatement(c.env.DB, columns, id, {
      name,
      code,
      category,
      startDate,
      endDate,
      assignmentUploadTime,
      assignmentUploadDays,
      deliveryMethods,
      isActive,
    });

    await c.env.DB.prepare(sql).bind(...values).run();

    const updated = await c.env.DB
      .prepare('SELECT * FROM classes WHERE id = ?')
      .bind(id)
      .first();

    if (!updated) {
      return c.json({ success: false, message: '수정된 수업 정보를 찾을 수 없습니다.' }, 500);
    }

    return c.json({ success: true, data: toClassPayload(updated) });
  } catch (error) {
    console.error('Error updating class:', error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ success: false, message: '수업 수정 실패', error: message }, 500);
  }
});

app.delete('/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    if (Number.isNaN(id)) {
      return c.json({ success: false, message: '삭제할 수업을 찾을 수 없습니다.' }, 400);
    }

    const existing = await c.env.DB
      .prepare('SELECT id FROM classes WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return c.json({ success: false, message: '수업 정보를 찾을 수 없습니다.' }, 404);
    }

    await c.env.DB.prepare('DELETE FROM classes WHERE id = ?').bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting class:', error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ success: false, message: '수업 삭제 실패', error: message }, 500);
  }
});

export default app;
