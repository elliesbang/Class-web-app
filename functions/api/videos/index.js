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

const toVideoPayload = (row) => ({
  id: row.id,
  title: row.title,
  url: row.url,
  description: row.description,
  classId: row.class_id,
  createdAt: normaliseDate(row.created_at),
  displayOrder: row.display_order,
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
      ? DB.prepare('SELECT * FROM videos WHERE class_id = ? ORDER BY display_order ASC, created_at DESC').bind(classId)
      : DB.prepare('SELECT * FROM videos ORDER BY class_id ASC, display_order ASC, created_at DESC');

    const result = await statement.all();
    const rows = (result?.results ?? []).map(toVideoPayload);

    return jsonResponse({ success: true, count: rows.length, data: rows });
  } catch (error) {
    // console.debug('[videos] Failed to fetch videos', error)
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
    const urlValue = typeof body.url === 'string' ? body.url.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() || null : null;
    const classId = typeof body.classId === 'number' ? body.classId : null;

    if (!title) {
      return jsonResponse({ success: false, count: 0, data: [], message: '영상 제목은 필수입니다.' }, 400);
    }

    if (!urlValue) {
      return jsonResponse({ success: false, count: 0, data: [], message: '영상 주소 또는 코드를 입력해주세요.' }, 400);
    }

    if (classId === null) {
      return jsonResponse({ success: false, count: 0, data: [], message: '수업 정보를 찾을 수 없습니다.' }, 400);
    }

    const orderResult = await DB.prepare('SELECT COALESCE(MAX(display_order), -1) as maxOrder FROM videos WHERE class_id = ?1')
      .bind(classId)
      .all();
    const orderRows = orderResult?.results ?? [];
    const lastOrder = typeof orderRows[0]?.maxOrder === 'number' ? orderRows[0].maxOrder : -1;
    const nextOrder = lastOrder + 1;

    const insertResult = await DB
      .prepare(
        'INSERT INTO videos (title, url, description, class_id, display_order) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING *',
      )
      .bind(title, urlValue, description, classId, nextOrder)
      .all();

    const rows = (insertResult?.results ?? []).map(toVideoPayload);

    return jsonResponse({ success: true, count: rows.length, data: rows });
  } catch (error) {
    // console.debug('[videos] Failed to create video', error)
    return errorResponse(error);
  }
};

export const onRequestPut = async (context) => {
  try {
    const { DB } = context.env;
    await ensureBaseSchema(DB);

    let body = {};
    try {
      body = await context.request.json();
    } catch (parseError) {
      return jsonResponse({ success: false, count: 0, data: [], message: '유효한 JSON 본문이 필요합니다.' }, 400);
    }

    const classId = typeof body.classId === 'number' ? body.classId : null;
    const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds : null;

    if (classId === null || !orderedIds) {
      return jsonResponse({ success: false, count: 0, data: [], message: '정렬 정보를 확인할 수 없습니다.' }, 400);
    }

    for (let index = 0; index < orderedIds.length; index += 1) {
      const id = orderedIds[index];
      await DB.prepare('UPDATE videos SET display_order = ?1 WHERE id = ?2 AND class_id = ?3')
        .bind(index, id, classId)
        .run();
    }

    const updatedResult = await DB.prepare(
      'SELECT * FROM videos WHERE class_id = ?1 ORDER BY display_order ASC, created_at DESC',
    )
      .bind(classId)
      .all();
    const rows = (updatedResult?.results ?? []).map(toVideoPayload);

    return jsonResponse({ success: true, count: rows.length, data: rows });
  } catch (error) {
    // console.debug('[videos] Failed to reorder videos', error)
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
      return jsonResponse({ success: false, count: 0, data: [], message: '삭제할 영상을 찾을 수 없습니다.' }, 400);
    }

    await DB.prepare('DELETE FROM videos WHERE id = ?1').bind(id).run();

    return jsonResponse({ success: true, count: 0, data: [] });
  } catch (error) {
    // console.debug('[videos] Failed to delete video', error)
    return errorResponse(error);
  }
};
