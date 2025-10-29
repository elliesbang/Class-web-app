const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
};

export const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload ?? {}), {
    status,
    headers: JSON_HEADERS,
  });

export const ensureDb = (env) => {
  const db = env?.DB;
  if (!db) {
    const error = new Error('Database binding "DB" is not configured.');
    error.status = 500;
    throw error;
  }

  return db;
};

export const handleError = (error) => {
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  const stack = error instanceof Error ? error.stack : undefined;
  const status = typeof error?.status === 'number' ? error.status : 500;

  console.error('[Classes API]', message, stack);

  return jsonResponse(
    {
      success: false,
      error: message,
      stack,
    },
    status,
  );
};

const toTrimmedString = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  const text = String(value).trim();
  return text.length > 0 ? text : '';
};

const toInteger = (value) => {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.trunc(number);
};

export const normaliseClassPayload = (input = {}) => {
  if (typeof input !== 'object' || input === null) {
    return {
      name: '',
      category_id: 0,
      start_date: '',
      end_date: '',
      upload_limit: '',
      upload_day: '',
      code: '',
      category: '',
      duration: '',
    };
  }

  return {
    name: toTrimmedString(input.name ?? input.class_name ?? input.title ?? input.classTitle),
    category_id: toInteger(input.category_id ?? input.categoryId ?? input.category ?? input.categoryName),
    start_date: toTrimmedString(input.start_date ?? input.startDate),
    end_date: toTrimmedString(input.end_date ?? input.endDate),
    upload_limit: toTrimmedString(
      input.upload_limit ??
        input.uploadLimit ??
        input.assignment_upload_time ??
        input.assignmentUploadTime,
    ),
    upload_day: toTrimmedString(
      input.upload_day ??
        input.uploadDay ??
        input.assignment_upload_days ??
        input.assignmentUploadDays,
    ),
    code: toTrimmedString(input.code ?? input.class_code ?? input.classCode),
    category: toTrimmedString(
      input.category ??
        input.class_category ??
        input.classCategory ??
        input.category_name ??
        input.categoryName,
    ),
    duration: toTrimmedString(
      input.duration ??
        input.class_duration ??
        input.classDuration ??
        input.class_time ??
        input.classTime,
    ),
  };
};

export const parseId = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }

  const id = Math.trunc(number);
  return id > 0 ? id : null;
};
