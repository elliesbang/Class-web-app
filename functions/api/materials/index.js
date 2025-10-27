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

const toMaterialPayload = (row) => ({
  id: row.id,
  title: row.title,
  fileUrl: row.file_url,
  description: row.description,
  fileName: row.file_name,
  mimeType: row.mime_type,
  fileSize: row.file_size,
  classId: row.class_id,
  createdAt: normaliseDate(row.created_at),
});

const extractIdFromPath = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last) {
    return Number.NaN;
  }
  return Number(last);
};

export const onRequestGet = async (context) => {
  try {
    const { DB } = context.env;
    await ensureBaseSchema(DB);

    const url = new URL(context.request.url);
    const classIdParam = url.searchParams.get('classId') ?? url.searchParams.get('class_id');
    const classId = classIdParam ? Number(classIdParam) : null;

    const statement = classId
      ? DB.prepare('SELECT * FROM materials WHERE class_id = ? ORDER BY created_at DESC').bind(classId)
      : DB.prepare('SELECT * FROM materials ORDER BY created_at DESC');

    const result = await statement.all();
    const rows = (result?.results ?? []).map(toMaterialPayload);

    return jsonResponse({ success: true, count: rows.length, data: rows });
  } catch (error) {
    // console.debug('[materials] Failed to fetch materials', error)
    return errorResponse(error);
  }
};

export const onRequestPost = async (context) => {
  try {
    const { DB } = context.env;
    await ensureBaseSchema(DB);

    let body = {};
    try {
      body = await context.request.json();
    } catch (parseError) {
      return jsonResponse(
        { success: false, count: 0, data: [], message: '유효한 JSON 본문이 필요합니다.' },
        400,
      );
    }

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const classId = typeof body.classId === 'number' ? body.classId : null;
    const description = typeof body.description === 'string' ? body.description.trim() || null : null;
    const fileUrl = typeof body.fileUrl === 'string' ? body.fileUrl : '';
    const fileName = typeof body.fileName === 'string' ? body.fileName : null;
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : null;
    const fileSize = typeof body.fileSize === 'number' ? body.fileSize : null;

    if (!title) {
      return jsonResponse({ success: false, count: 0, data: [], message: '자료 제목을 입력해주세요.' }, 400);
    }

    if (classId === null) {
      return jsonResponse({ success: false, count: 0, data: [], message: '수업 정보를 찾을 수 없습니다.' }, 400);
    }

    if (!fileUrl) {
      return jsonResponse({ success: false, count: 0, data: [], message: '업로드할 파일을 선택해주세요.' }, 400);
    }

    const insertResult = await DB
      .prepare(
        'INSERT INTO materials (title, file_url, description, file_name, mime_type, file_size, class_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) RETURNING *',
      )
      .bind(title, fileUrl, description, fileName, mimeType, fileSize, classId)
      .all();

    const rows = (insertResult?.results ?? []).map(toMaterialPayload);

    return jsonResponse({ success: true, count: rows.length, data: rows });
  } catch (error) {
    // console.debug('[materials] Failed to create material', error)
    return errorResponse(error);
  }
};

export const onRequestDelete = async (context) => {
  try {
    const { DB } = context.env;
    await ensureBaseSchema(DB);

    const url = new URL(context.request.url);
    const idParam = url.searchParams.get('id');
    const pathId = extractIdFromPath(url.pathname);
    const id = idParam ? Number(idParam) : pathId;

    if (Number.isNaN(id)) {
      return jsonResponse({ success: false, count: 0, data: [], message: '삭제할 자료를 찾을 수 없습니다.' }, 400);
    }

    await DB.prepare('DELETE FROM materials WHERE id = ?1').bind(id).run();

    return jsonResponse({ success: true, count: 0, data: [] });
  } catch (error) {
    // console.debug('[materials] Failed to delete material', error)
    return errorResponse(error);
  }
};
