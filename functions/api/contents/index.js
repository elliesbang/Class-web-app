import DB from '../../_db';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
};

const jsonResponse = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: JSON_HEADERS,
  });

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const classIdParam = url.searchParams.get('class_id');

  if (!classIdParam) {
    return jsonResponse(
      { success: false, message: 'class_id가 필요합니다.' },
      { status: 400 },
    );
  }

  const classId = Number(classIdParam);

  if (!Number.isInteger(classId) || classId <= 0) {
    return jsonResponse(
      { success: false, message: '유효한 class_id가 필요합니다.' },
      { status: 400 },
    );
  }

  try {
    const db = new DB(env.DB);
    const statement = db
      .prepare(`SELECT * FROM contents WHERE class_id = ?1 ORDER BY created_at DESC`)
      .bind(classId);
    const { results = [] } = await statement.all();

    return jsonResponse({ success: true, data: results }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch contents:', error);
    return jsonResponse(
      { success: false, message: '콘텐츠 조회에 실패했습니다.' },
      { status: 500 },
    );
  }
}
