import DB from '../../_db';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
};

const jsonResponse = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: JSON_HEADERS,
  });

const parseJson = async (request) => {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('유효한 JSON 본문이 필요합니다.');
  }
};

const toTrimmedString = (value) =>
  typeof value === 'string' ? value.trim() : '';

export async function onRequestPost({ request, env }) {
  let body;

  try {
    body = await parseJson(request);
  } catch (error) {
    return jsonResponse({ success: false, message: error.message }, { status: 400 });
  }

  const classId = Number(body?.class_id);
  const type = toTrimmedString(body?.type);
  const title = toTrimmedString(body?.title);
  const description = typeof body?.description === 'string' ? body.description : '';
  const fileUrl = typeof body?.file_url === 'string' ? body.file_url : '';

  if (!Number.isInteger(classId) || classId <= 0) {
    return jsonResponse({ success: false, message: '유효한 class_id가 필요합니다.' }, { status: 400 });
  }

  if (!type) {
    return jsonResponse({ success: false, message: 'type 값이 필요합니다.' }, { status: 400 });
  }

  if (!title) {
    return jsonResponse({ success: false, message: 'title 값이 필요합니다.' }, { status: 400 });
  }

  try {
    const db = new DB(env.DB);

    await db
      .prepare(
        `INSERT INTO contents (class_id, type, title, description, file_url)
         VALUES (?1, ?2, ?3, ?4, ?5)`
      )
      .bind(classId, type, title, description, fileUrl)
      .run();

    const inserted = await db
      .prepare(`SELECT * FROM contents WHERE id = last_insert_rowid()`)
      .first();

    return jsonResponse(
      {
        success: true,
        data: {
          message: '콘텐츠가 등록되었습니다.',
          content: inserted ?? null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to create content:', error);
    return jsonResponse({ success: false, message: '콘텐츠 등록에 실패했습니다.' }, { status: 500 });
  }
}
