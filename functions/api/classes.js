import { Hono } from 'hono';
import { z } from 'zod';

const VALID_WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

const relaxedStringSchema = z.preprocess(
  (value) => {
    if (value == null) {
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    const stringified = String(value).trim();
    return stringified.length > 0 ? stringified : null;
  },
  z.string().optional().nullable(),
);

const parseOptionalString = (value) => {
  const result = relaxedStringSchema.safeParse(value);
  if (!result.success) {
    return null;
  }

  return result.data ?? null;
};

const toNonEmptyString = (value) => {
  const parsed = parseOptionalString(value);
  return typeof parsed === 'string' && parsed.length > 0 ? parsed : null;
};

const toNullableString = (value) => parseOptionalString(value);

const toNullableDate = (value) => {
  const parsed = parseOptionalString(value);
  return typeof parsed === 'string' ? parsed : null;
};

const toNullableNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
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
      const normalised = parseOptionalString(item);
      if (!normalised || seen.has(normalised)) {
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
      .map((item) => parseOptionalString(item))
      .filter((item) => typeof item === 'string');
  }

  if (value == null) {
    return [];
  }

  const parsed = parseOptionalString(value);
  if (parsed == null) {
    return [];
  }

  return toStringArray(parsed);
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
  const parsed = parseOptionalString(value);
  if (typeof parsed === 'string') {
    const normalised = parsed.toLowerCase();
    if (normalised === 'same_day' || normalised === 'day_only' || normalised === 'single_day') {
      return 'same_day';
    }
    if (normalised === 'all_day') {
      return 'all_day';
    }
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

const hasColumn = (columns, candidate) => columns.has(candidate.toLowerCase());

const resolveColumnName = (columns, ...candidates) => {
  for (const candidate of candidates) {
    if (candidate && hasColumn(columns, candidate)) {
      return candidate;
    }
  }
  return null;
};

const findIdColumn = (columns) => resolveColumnName(columns, 'id', 'class_id', 'classId', 'classID');

const buildOrderByClause = (columns, tableAlias = '') => {
  const prefix = tableAlias ? `${tableAlias}.` : '';
  const orderBy = [];

  const createdColumn = resolveColumnName(columns, 'created_at', 'createdAt');
  if (createdColumn) {
    orderBy.push(`${prefix}${createdColumn} DESC`);
  }

  const updatedColumn = resolveColumnName(columns, 'updated_at', 'updatedAt');
  if (updatedColumn) {
    orderBy.push(`${prefix}${updatedColumn} DESC`);
  }

  const idColumn = findIdColumn(columns);
  if (idColumn) {
    orderBy.push(`${prefix}${idColumn} DESC`);
  }

  if (orderBy.length === 0) {
    return '';
  }

  return ` ORDER BY ${orderBy.join(', ')}`;
};

const trySelectWithCategory = async (db, columns) => {
  if (!hasColumn(columns, 'category_id')) {
    return null;
  }

  try {
    const orderBy = buildOrderByClause(columns, 'c');
    const { results } = await db
      .prepare(
        `SELECT c.*, cat.name AS category_name
         FROM classes c
         LEFT JOIN categories cat ON c.category_id = cat.id${orderBy}`,
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

  const orderBy = buildOrderByClause(columns);
  const query = `SELECT * FROM classes${orderBy}`;
  const { results } = await db.prepare(query).all();

  return results ?? [];
};

const resolveCategoryId = async (db, name) => {
  const parsed = parseOptionalString(name);
  if (!parsed) {
    return null;
  }

  try {
    const row = await db
      .prepare('SELECT id FROM categories WHERE name = ? LIMIT 1')
      .bind(parsed)
      .first();
    return row && typeof row.id === 'number' ? row.id : null;
  } catch (error) {
    console.warn('[classes] Failed to resolve category id:', error);
    return null;
  }
};

const determineCategoryId = async (db, options) => {
  const { categoryIdCandidate, categoryName, fallbackId } = options;

  const direct = toNullableNumber(categoryIdCandidate);
  if (direct != null) {
    return direct;
  }

  const resolved = await resolveCategoryId(db, categoryName);
  if (resolved != null) {
    return resolved;
  }

  return toNullableNumber(fallbackId);
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
  const rawId = getRowValue(row, 'id', 'class_id', 'classId', 'classID');
  const id = Number(rawId);
  const name = toNonEmptyString(getRowValue(row, 'name', 'class_name', 'className')) ?? '';

  const code = parseStringColumn(row, 'code', 'class_code', 'classCode');
  const category = parseStringColumn(row, 'category', 'class_category', 'category_name', 'categoryName');
  const categoryId = toNullableNumber(getRowValue(row, 'category_id', 'categoryId'));
  const startDate = parseDateColumn(row, 'start_date', 'startDate');
  const endDate = parseDateColumn(row, 'end_date', 'endDate');

  const assignmentUploadTime = normaliseAssignmentUploadTime(
    getRowValue(
      row,
      'assignment_upload_time',
      'assignmentUploadTime',
      'assignment_submission_time',
      'assignmentSubmissionTime',
      'upload_limit',
      'uploadLimit',
    ),
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

  const deliveryMethods = parseStoredArray(
    getRowValue(row, 'delivery_methods', 'delivery_method', 'deliveryMethods', 'deliveryMethod'),
  );

  const isActive = parseBooleanFlag(getRowValue(row, 'is_active', 'isActive', 'active', 'status'), true);

  const createdAt = parseDateColumn(row, 'created_at', 'createdAt');
  const updatedAt = parseDateColumn(row, 'updated_at', 'updatedAt');

  return {
    id,
    name,
    code: code ?? '',
    category: category ?? '',
    categoryId: categoryId ?? null,
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
  const nameColumn = resolveColumnName(columns, 'name', 'class_name', 'className');
  if (!nameColumn) {
    throw new Error("classes 테이블에 'name' 또는 'class_name' 컬럼이 필요합니다.");
  }

  const fields = [nameColumn];
  const placeholders = ['?'];
  const values = [payload.name];

  const pushField = (column, value) => {
    fields.push(column);
    placeholders.push('?');
    values.push(value);
  };

  const codeColumn = resolveColumnName(columns, 'code', 'class_code', 'classCode');
  if (codeColumn) {
    pushField(codeColumn, payload.code);
  }

  const categoryColumn = resolveColumnName(columns, 'category', 'class_category', 'classCategory');
  if (categoryColumn) {
    pushField(categoryColumn, payload.category);
  }

  const categoryIdColumn = resolveColumnName(columns, 'category_id', 'categoryId');
  if (categoryIdColumn) {
    const categoryId = await determineCategoryId(db, {
      categoryIdCandidate: payload.categoryId,
      categoryName: payload.category,
    });
    pushField(categoryIdColumn, categoryId);
  }

  const startDateColumn = resolveColumnName(columns, 'start_date', 'startDate');
  if (startDateColumn) {
    pushField(startDateColumn, payload.startDate);
  }

  const endDateColumn = resolveColumnName(columns, 'end_date', 'endDate');
  if (endDateColumn) {
    pushField(endDateColumn, payload.endDate);
  }

  const assignmentTimeColumn = resolveColumnName(
    columns,
    'assignment_upload_time',
    'assignmentUploadTime',
    'assignment_submission_time',
    'assignmentSubmissionTime',
  );
  if (assignmentTimeColumn) {
    pushField(assignmentTimeColumn, payload.assignmentUploadTime);
  } else {
    const uploadLimitColumn = resolveColumnName(columns, 'upload_limit', 'uploadLimit');
    if (uploadLimitColumn) {
      pushField(uploadLimitColumn, payload.assignmentUploadTime);
    }
  }

  const daysJson = JSON.stringify(payload.assignmentUploadDays);
  const assignmentDaysColumn = resolveColumnName(
    columns,
    'assignment_upload_days',
    'assignmentUploadDays',
    'assignment_submission_days',
    'assignmentSubmissionDays',
  );
  if (assignmentDaysColumn) {
    pushField(assignmentDaysColumn, daysJson);
  } else {
    const uploadDayColumn = resolveColumnName(columns, 'upload_day', 'uploadDay');
    if (uploadDayColumn) {
      pushField(uploadDayColumn, payload.assignmentUploadDays.join(','));
    }
  }

  const deliveryListColumn = resolveColumnName(columns, 'delivery_methods', 'deliveryMethods');
  if (deliveryListColumn) {
    pushField(deliveryListColumn, JSON.stringify(payload.deliveryMethods));
  } else {
    const deliveryColumn = resolveColumnName(columns, 'delivery_method', 'deliveryMethod');
    if (deliveryColumn) {
      pushField(deliveryColumn, payload.deliveryMethods.join(','));
    }
  }

  const activeColumn = resolveColumnName(columns, 'is_active', 'isActive', 'active', 'status');
  if (activeColumn) {
    pushField(activeColumn, payload.isActive ? 1 : 0);
  }

  const now = new Date().toISOString();
  const createdColumn = resolveColumnName(columns, 'created_at', 'createdAt');
  if (createdColumn) {
    pushField(createdColumn, now);
  }
  const updatedColumn = resolveColumnName(columns, 'updated_at', 'updatedAt');
  if (updatedColumn) {
    pushField(updatedColumn, now);
  }

  const sql = `INSERT INTO classes (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;

  return { sql, values };
};

const buildUpdateStatement = async (db, columns, id, payload) => {
  const nameColumn = resolveColumnName(columns, 'name', 'class_name', 'className');
  if (!nameColumn) {
    throw new Error("classes 테이블에 'name' 또는 'class_name' 컬럼이 필요합니다.");
  }

  const setClauses = [`${nameColumn} = ?`];
  const values = [payload.name];

  const pushSet = (column, value) => {
    setClauses.push(`${column} = ?`);
    values.push(value);
  };

  const codeColumn = resolveColumnName(columns, 'code', 'class_code', 'classCode');
  if (codeColumn) {
    pushSet(codeColumn, payload.code);
  }

  const categoryColumn = resolveColumnName(columns, 'category', 'class_category', 'classCategory');
  if (categoryColumn) {
    pushSet(categoryColumn, payload.category);
  }

  const categoryIdColumn = resolveColumnName(columns, 'category_id', 'categoryId');
  if (categoryIdColumn) {
    const categoryId = await determineCategoryId(db, {
      categoryIdCandidate: payload.categoryId,
      categoryName: payload.category,
      fallbackId: payload.existingCategoryId,
    });
    pushSet(categoryIdColumn, categoryId);
  }

  const startDateColumn = resolveColumnName(columns, 'start_date', 'startDate');
  if (startDateColumn) {
    pushSet(startDateColumn, payload.startDate);
  }

  const endDateColumn = resolveColumnName(columns, 'end_date', 'endDate');
  if (endDateColumn) {
    pushSet(endDateColumn, payload.endDate);
  }

  const assignmentTimeColumn = resolveColumnName(
    columns,
    'assignment_upload_time',
    'assignmentUploadTime',
    'assignment_submission_time',
    'assignmentSubmissionTime',
  );
  if (assignmentTimeColumn) {
    pushSet(assignmentTimeColumn, payload.assignmentUploadTime);
  } else {
    const uploadLimitColumn = resolveColumnName(columns, 'upload_limit', 'uploadLimit');
    if (uploadLimitColumn) {
      pushSet(uploadLimitColumn, payload.assignmentUploadTime);
    }
  }

  const daysJson = JSON.stringify(payload.assignmentUploadDays);
  const assignmentDaysColumn = resolveColumnName(
    columns,
    'assignment_upload_days',
    'assignmentUploadDays',
    'assignment_submission_days',
    'assignmentSubmissionDays',
  );
  if (assignmentDaysColumn) {
    pushSet(assignmentDaysColumn, daysJson);
  } else {
    const uploadDayColumn = resolveColumnName(columns, 'upload_day', 'uploadDay');
    if (uploadDayColumn) {
      pushSet(uploadDayColumn, payload.assignmentUploadDays.join(','));
    }
  }

  const deliveryListColumn = resolveColumnName(columns, 'delivery_methods', 'deliveryMethods');
  if (deliveryListColumn) {
    pushSet(deliveryListColumn, JSON.stringify(payload.deliveryMethods));
  } else {
    const deliveryColumn = resolveColumnName(columns, 'delivery_method', 'deliveryMethod');
    if (deliveryColumn) {
      pushSet(deliveryColumn, payload.deliveryMethods.join(','));
    }
  }

  const activeColumn = resolveColumnName(columns, 'is_active', 'isActive', 'active', 'status');
  if (activeColumn) {
    pushSet(activeColumn, payload.isActive ? 1 : 0);
  }

  const now = new Date().toISOString();
  const updatedColumn = resolveColumnName(columns, 'updated_at', 'updatedAt');
  if (updatedColumn) {
    pushSet(updatedColumn, now);
  }

  const idColumn = findIdColumn(columns) ?? 'id';
  const sql = `UPDATE classes SET ${setClauses.join(', ')} WHERE ${idColumn} = ?`;
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
    const idColumn = findIdColumn(columns) ?? 'id';
    const { sql, values } = await buildInsertStatement(c.env.DB, columns, {
      name,
      code,
      category,
      categoryId: payload.categoryId ?? payload.category_id ?? null,
      startDate,
      endDate,
      assignmentUploadTime,
      assignmentUploadDays,
      deliveryMethods,
      isActive,
    });

    const insertResult = await c.env.DB.prepare(sql).bind(...values).run();
    const insertedId = insertResult?.meta?.last_row_id;

    let inserted = null;
    if (insertedId != null) {
      inserted = await c.env.DB
        .prepare(`SELECT * FROM classes WHERE ${idColumn} = ?`)
        .bind(insertedId)
        .first();
    }

    if (!inserted) {
      const orderBy = buildOrderByClause(columns);
      const fallbackQuery = `SELECT * FROM classes${orderBy} LIMIT 1`;
      inserted = await c.env.DB.prepare(fallbackQuery).first();
    }

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

    const columns = await getClassTableColumns(c.env.DB);
    const idColumn = findIdColumn(columns) ?? 'id';

    const existing = await c.env.DB
      .prepare(`SELECT * FROM classes WHERE ${idColumn} = ?`)
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

    const existingName = toNonEmptyString(getRowValue(existing, 'name', 'class_name', 'className')) ?? '';
    const name = toNonEmptyString(payload.name) ?? existingName;

    const existingCode = parseStringColumn(existing, 'code', 'class_code', 'classCode');
    const code = Object.prototype.hasOwnProperty.call(payload, 'code')
      ? toNullableString(payload.code)
      : existingCode;

    const existingCategory = parseStringColumn(
      existing,
      'category',
      'class_category',
      'category_name',
      'categoryName',
    );
    const category = Object.prototype.hasOwnProperty.call(payload, 'category')
      ? toNullableString(payload.category)
      : existingCategory;

    const existingCategoryId = toNullableNumber(getRowValue(existing, 'category_id', 'categoryId'));
    const hasCategoryIdField =
      Object.prototype.hasOwnProperty.call(payload, 'categoryId') ||
      Object.prototype.hasOwnProperty.call(payload, 'category_id');
    const categoryIdCandidate = hasCategoryIdField ? payload.categoryId ?? payload.category_id : null;

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
      'assignment_submission_time',
      'assignmentSubmissionTime',
      'upload_limit',
      'uploadLimit',
    );
    const assignmentUploadTime = normaliseAssignmentUploadTime(
      Object.prototype.hasOwnProperty.call(payload, 'assignmentUploadTime')
        ? payload.assignmentUploadTime
        : existingUploadTime,
      normaliseAssignmentUploadTime(existingUploadTime, 'all_day'),
    );

    const existingDeliveryMethods = parseStoredArray(
      getRowValue(existing, 'delivery_methods', 'delivery_method', 'deliveryMethods', 'deliveryMethod'),
    );
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

    const { sql, values } = await buildUpdateStatement(c.env.DB, columns, id, {
      name,
      code,
      category,
      categoryId: categoryIdCandidate,
      existingCategoryId,
      startDate,
      endDate,
      assignmentUploadTime,
      assignmentUploadDays,
      deliveryMethods,
      isActive,
    });

    await c.env.DB.prepare(sql).bind(...values).run();

    const updated = await c.env.DB
      .prepare(`SELECT * FROM classes WHERE ${idColumn} = ?`)
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

    const columns = await getClassTableColumns(c.env.DB);
    const idColumn = findIdColumn(columns) ?? 'id';

    const existing = await c.env.DB
      .prepare(`SELECT ${idColumn} FROM classes WHERE ${idColumn} = ?`)
      .bind(id)
      .first();

    if (!existing) {
      return c.json({ success: false, message: '수업 정보를 찾을 수 없습니다.' }, 404);
    }

    await c.env.DB.prepare(`DELETE FROM classes WHERE ${idColumn} = ?`).bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting class:', error);
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ success: false, message: '수업 삭제 실패', error: message }, 500);
  }
});

export default app;
