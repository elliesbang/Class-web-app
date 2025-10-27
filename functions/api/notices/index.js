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

const toNoticePayload = (row) => ({
  id: row.id,
  title: row.title,
  content: row.content,
  author: row.author,
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
      ? DB.prepare('SELECT * FROM notices WHERE class_id = ? ORDER BY created_at DESC').bind(classId)
      : DB.prepare('SELECT * FROM notices ORDER BY created_at DESC');

    const result = await statement.all();
    const rows = (result?.results ?? []).map(toNoticePayload);

    return jsonResponse({ success: true, count: rows.length, data: rows });
  } catch (error) {
    // console.debug('[notices] Failed to fetch notices', error)
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
      return jsonResponse({ success: false, count: 0, data: [], message: '유효한 JSON 본문이 필요합니다.' }, 400);
    }

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const classId = typeof body.classId === 'number' ? body.classId : null;
    const author = typeof body.author === 'string' ? body.author.trim() || null : null;

    if (!title) {
      return jsonResponse({ success: false, count: 0, data: [], message: '공지 제목을 입력해주세요.' }, 400);
    }

    if (!content) {
      return jsonResponse({ success: false, count: 0, data: [], message: '공지 내용을 입력해주세요.' }, 400);
    }

    if (classId === null) {
      return jsonResponse({ success: false, count: 0, data: [], message: '수업 정보를 찾을 수 없습니다.' }, 400);
    }

    const insertResult = await DB
      .prepare('INSERT INTO notices (title, content, author, class_id) VALUES (?1, ?2, ?3, ?4) RETURNING *')
      .bind(title, content, author, classId)
      .all();

    const rows = (insertResult?.results ?? []).map(toNoticePayload);

    return jsonResponse({ success: true, count: rows.length, data: rows });
  } catch (error) {
    // console.debug('[notices] Failed to create notice', error)
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
      return jsonResponse({ success: false, count: 0, data: [], message: '삭제할 공지를 찾을 수 없습니다.' }, 400);
    }

    await DB.prepare('DELETE FROM notices WHERE id = ?1').bind(id).run();

    return jsonResponse({ success: true, count: 0, data: [] });
  } catch (error) {
    // console.debug('[notices] Failed to delete notice', error)
    return errorResponse(error);
  }
};
