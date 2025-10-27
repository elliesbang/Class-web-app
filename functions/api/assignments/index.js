import { ensureBaseSchema, normaliseDate } from '../_utils/index.js';

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const errorResponse = (error) =>
  new Response(
    JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    },
  );

const ASSIGNMENT_STATUSES = ['미제출', '제출됨', '피드백 완료'];
const ASSIGNMENT_FILE_TYPES = ['image', 'pdf', 'link', 'other'];

const mapRowToResponse = (row) => {
  const submittedAt = normaliseDate(row.submitted_at);
  const createdAt = normaliseDate(row.created_at);

  let fileType = 'other';
  if (typeof row.file_type === 'string' && ASSIGNMENT_FILE_TYPES.includes(row.file_type)) {
    fileType = row.file_type;
  } else if (row.link) {
    fileType = 'link';
  } else if (row.file_url?.startsWith('data:image') || row.file_name?.match(/\.(png|jpg|jpeg|gif)$/i)) {
    fileType = 'image';
  } else if (row.file_url?.includes('pdf') || row.file_name?.toLowerCase().endsWith('.pdf')) {
    fileType = 'pdf';
  }

  let status = '제출됨';
  if (typeof row.status === 'string' && ASSIGNMENT_STATUSES.includes(row.status)) {
    status = row.status;
  }

  return {
    id: row.id,
    title: row.title,
    classId: row.class_id,
    className: row.class_name ?? null,
    studentName: row.student_name,
    studentEmail: row.student_email ?? null,
    fileUrl: row.file_url ?? null,
    fileName: row.file_name ?? null,
    fileType,
    link: row.link ?? null,
    status,
    submittedAt,
    createdAt,
  };
};

const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const slice = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...slice);
  }

  return btoa(binary);
};

const parseMultipartPayload = async (request) => {
  const formData = await request.formData();

  const rawClassId = formData.get('classId');
  const classId =
    typeof rawClassId === 'string' ? Number(rawClassId) : typeof rawClassId === 'number' ? rawClassId : Number.NaN;

  const payload = {
    title: formData.get('title')?.toString(),
    classId: Number.isNaN(classId) ? undefined : classId,
    studentName: formData.get('studentName')?.toString(),
    studentEmail: formData.get('studentEmail')?.toString() ?? null,
    link: formData.get('link')?.toString() ?? null,
    status: formData.get('status')?.toString() ?? undefined,
    submittedAt: formData.get('submittedAt')?.toString() ?? undefined,
  };

  const file = formData.get('file');
  if (file instanceof File && file.size > 0) {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    payload.fileUrl = `data:${file.type || 'application/octet-stream'};base64,${base64}`;
    payload.fileName = file.name;

    if (file.type.startsWith('image/')) {
      payload.fileType = 'image';
    } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      payload.fileType = 'pdf';
    } else {
      payload.fileType = 'other';
    }
  }

  return payload;
};

const parseJsonPayload = async (request) => {
  try {
    const payload = await request.json();
    if (!payload || typeof payload !== 'object') {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
};

export const onRequestGet = async (context) => {
  try {
    const { DB } = context.env;
    await ensureBaseSchema(DB);

    const url = new URL(context.request.url);
    const params = [];
    const where = [];

    const classId = url.searchParams.get('classId');
    if (classId) {
      const parsed = Number(classId);
      if (!Number.isNaN(parsed)) {
        where.push('a.class_id = ?1');
        params.push(parsed);
      }
    }

    let query = `
      SELECT
        a.id,
        a.title,
        a.class_id,
        a.student_name,
        a.student_email,
        a.file_url,
        a.file_name,
        a.file_type,
        a.link,
        a.status,
        a.submitted_at,
        a.created_at,
        c.name AS class_name
      FROM assignments a
      LEFT JOIN classes c ON a.class_id = c.id
    `;

    if (where.length > 0) {
      query += ` WHERE ${where.join(' AND ')}`;
    }

    query += ' ORDER BY datetime(a.submitted_at) DESC, a.id DESC';

    const statement = params.length > 0 ? DB.prepare(query).bind(...params) : DB.prepare(query);
    const result = await statement.all();
    const rows = (result?.results ?? []).map(mapRowToResponse);

    return jsonResponse({ success: true, count: rows.length, data: rows });
  } catch (error) {
    // console.debug('[assignments] Failed to fetch assignments', error)
    return errorResponse(error);
  }
};

export const onRequestPost = async (context) => {
  try {
    const { DB } = context.env;
    await ensureBaseSchema(DB);

    const request = context.request;
    const contentType = request.headers.get('content-type') ?? '';

    let payload = null;
    if (contentType.includes('application/json')) {
      payload = await parseJsonPayload(request);
    } else if (contentType.includes('multipart/form-data')) {
      payload = await parseMultipartPayload(request);
    }

    if (!payload) {
      return jsonResponse({ success: false, count: 0, data: [], message: '잘못된 요청입니다.' }, 400);
    }

    if (typeof payload.classId !== 'number' || Number.isNaN(payload.classId)) {
      return jsonResponse({ success: false, count: 0, data: [], message: 'classId는 필수 값입니다.' }, 400);
    }

    const title = typeof payload.title === 'string' && payload.title.trim().length > 0 ? payload.title.trim() : '과제 제출';
    const studentName =
      typeof payload.studentName === 'string' && payload.studentName.trim().length > 0
        ? payload.studentName.trim()
        : '이름 미입력';
    const studentEmail = typeof payload.studentEmail === 'string' ? payload.studentEmail.trim() || null : null;
    const submittedAt = payload.submittedAt ? normaliseDate(payload.submittedAt) : new Date().toISOString();

    let status = '제출됨';
    if (typeof payload.status === 'string' && ASSIGNMENT_STATUSES.includes(payload.status)) {
      status = payload.status;
    }

    let fileType = 'other';
    if (typeof payload.fileType === 'string' && ASSIGNMENT_FILE_TYPES.includes(payload.fileType)) {
      fileType = payload.fileType;
    } else if (payload.link) {
      fileType = 'link';
    }

    const insertionResult = await DB
      .prepare(
        `INSERT INTO assignments (title, class_id, student_name, student_email, file_url, file_name, file_type, link, status, submitted_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
         RETURNING id, title, class_id, student_name, student_email, file_url, file_name, file_type, link, status, submitted_at, created_at`,
      )
      .bind(
        title,
        payload.classId,
        studentName,
        studentEmail,
        payload.fileUrl ?? null,
        payload.fileName ?? null,
        fileType,
        payload.link ?? null,
        status,
        submittedAt,
      )
      .all();

    const insertedRows = insertionResult?.results ?? [];
    const firstInserted = insertedRows[0];

    let rows = insertedRows;
    if (firstInserted) {
      const joinedResult = await DB
        .prepare(
          `SELECT a.id, a.title, a.class_id, a.student_name, a.student_email, a.file_url, a.file_name, a.file_type, a.link, a.status, a.submitted_at, a.created_at, c.name AS class_name
           FROM assignments a
           LEFT JOIN classes c ON a.class_id = c.id
           WHERE a.id = ?1`,
        )
        .bind(firstInserted.id)
        .all();
      rows = joinedResult?.results ?? insertedRows;
    }

    const data = rows.map(mapRowToResponse);

    return jsonResponse({ success: true, count: data.length, data });
  } catch (error) {
    // console.debug('[assignments] Failed to create assignment', error)
    return errorResponse(error);
  }
};
