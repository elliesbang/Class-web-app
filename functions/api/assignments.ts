import type { Env } from './_utils';
import { ensureBaseSchema, errorResponse, jsonResponse, normaliseDate, rowsToCamelCase } from './_utils';

type AssignmentStatus = '미제출' | '제출됨' | '피드백 완료';
type AssignmentFileType = 'image' | 'pdf' | 'link' | 'other';

type AssignmentRow = {
  id: number;
  title: string;
  class_id: number;
  student_name: string;
  student_email: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  link: string | null;
  status: string | null;
  submitted_at: string | null;
  created_at: string | null;
  class_name?: string | null;
};

type AssignmentResponse = {
  id: number;
  title: string;
  classId: number;
  className: string | null;
  studentName: string;
  studentEmail: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: AssignmentFileType;
  link: string | null;
  status: AssignmentStatus;
  submittedAt: string;
  createdAt: string;
};

type AssignmentPayload = {
  title?: string;
  classId?: number;
  studentName?: string;
  studentEmail?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: AssignmentFileType;
  link?: string | null;
  status?: AssignmentStatus;
  submittedAt?: string | null;
};

const ASSIGNMENT_STATUSES: AssignmentStatus[] = ['미제출', '제출됨', '피드백 완료'];
const ASSIGNMENT_FILE_TYPES: AssignmentFileType[] = ['image', 'pdf', 'link', 'other'];

const mapRowToResponse = (row: AssignmentRow): AssignmentResponse => {
  const submittedAt = normaliseDate(row.submitted_at);
  const createdAt = normaliseDate(row.created_at);

  let fileType: AssignmentFileType = 'other';
  if (typeof row.file_type === 'string' && ASSIGNMENT_FILE_TYPES.includes(row.file_type as AssignmentFileType)) {
    fileType = row.file_type as AssignmentFileType;
  } else if (row.link) {
    fileType = 'link';
  } else if (row.file_url?.startsWith('data:image') || row.file_name?.match(/\.(png|jpg|jpeg|gif)$/i)) {
    fileType = 'image';
  } else if (row.file_url?.includes('pdf') || row.file_name?.toLowerCase().endsWith('.pdf')) {
    fileType = 'pdf';
  }

  let status: AssignmentStatus = '제출됨';
  if (typeof row.status === 'string' && ASSIGNMENT_STATUSES.includes(row.status as AssignmentStatus)) {
    status = row.status as AssignmentStatus;
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

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const slice = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...slice);
  }

  return btoa(binary);
};

const parseMultipartPayload = async (request: Request): Promise<AssignmentPayload> => {
  const formData = await request.formData();

  const rawClassId = formData.get('classId');
  const classId = typeof rawClassId === 'string' ? Number(rawClassId) : typeof rawClassId === 'number' ? rawClassId : NaN;

  const payload: AssignmentPayload = {
    title: formData.get('title')?.toString(),
    classId: Number.isNaN(classId) ? undefined : classId,
    studentName: formData.get('studentName')?.toString(),
    studentEmail: formData.get('studentEmail')?.toString() ?? null,
    link: formData.get('link')?.toString() ?? null,
    status: (formData.get('status')?.toString() as AssignmentStatus) ?? undefined,
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

const parseJsonPayload = async (request: Request): Promise<AssignmentPayload | null> => {
  const payload = (await request.json().catch(() => null)) as AssignmentPayload | null;
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  return payload;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  await ensureBaseSchema(env.DB);

  const url = new URL(request.url);
  const params: Array<number> = [];
  const where: string[] = [];

  const classId = url.searchParams.get('classId');
  if (classId) {
    const parsed = Number(classId);
    if (!Number.isNaN(parsed)) {
      where.push('a.class_id = ?');
      params.push(parsed);
    }
  }

  const limitParam = url.searchParams.get('limit');
  let limitValue: number | null = null;
  if (limitParam) {
    const parsedLimit = Number(limitParam);
    if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
      limitValue = Math.floor(parsedLimit);
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

  if (limitValue !== null) {
    query += ' LIMIT ?';
    params.push(limitValue);
  }

  const statement = params.length > 0 ? env.DB.prepare(query).bind(...params) : env.DB.prepare(query);
  const { results } = await statement.all<AssignmentRow>();

  const assignments = rowsToCamelCase(results).map(mapRowToResponse);

  return jsonResponse(true, { assignments });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const contentType = request.headers.get('content-type') ?? '';

  let payload: AssignmentPayload | null = null;
  if (contentType.includes('application/json')) {
    payload = await parseJsonPayload(request);
  } else if (contentType.includes('multipart/form-data')) {
    payload = await parseMultipartPayload(request);
  }

  if (!payload) {
    return errorResponse('잘못된 요청입니다.', 400);
  }

  if (typeof payload.classId !== 'number' || Number.isNaN(payload.classId)) {
    return errorResponse('classId는 필수 값입니다.', 400);
  }

  const title = payload.title?.trim() || '과제 제출';
  const studentName = payload.studentName?.trim() || '이름 미입력';
  const studentEmail = payload.studentEmail?.trim() || null;
  const submittedAt = payload.submittedAt ? normaliseDate(payload.submittedAt) : new Date().toISOString();

  let status: AssignmentStatus = '제출됨';
  if (payload.status && ASSIGNMENT_STATUSES.includes(payload.status)) {
    status = payload.status;
  }

  let fileType: AssignmentFileType = 'other';
  if (payload.fileType && ASSIGNMENT_FILE_TYPES.includes(payload.fileType)) {
    fileType = payload.fileType;
  } else if (payload.link) {
    fileType = 'link';
  }

  await ensureBaseSchema(env.DB);

  const insertion = env.DB
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
    );

  const { results } = await insertion.all<AssignmentRow>();
  const [inserted] = rowsToCamelCase(results);

  if (!inserted) {
    return errorResponse('과제 저장에 실패했습니다.', 500);
  }

  const { results: joinedResults } = await env.DB
    .prepare(
      `SELECT a.id, a.title, a.class_id, a.student_name, a.student_email, a.file_url, a.file_name, a.file_type, a.link, a.status, a.submitted_at, a.created_at, c.name AS class_name
       FROM assignments a
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.id = ?1`,
    )
    .bind(inserted.id)
    .all<AssignmentRow>();

  const [withClass] = rowsToCamelCase(joinedResults);
  const responsePayload = mapRowToResponse(withClass ?? inserted);

  console.log('[assignments] 저장 완료', {
    id: responsePayload.id,
    classId: responsePayload.classId,
    title: responsePayload.title,
    studentName: responsePayload.studentName,
    status: responsePayload.status,
  });

  return jsonResponse(true, { assignment: responsePayload }, undefined, 201);
};
