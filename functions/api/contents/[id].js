import DB from '../../_db';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
};

const jsonResponse = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: JSON_HEADERS,
  });

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function onRequestGet({ params, env }) {
  const id = parseId(params?.id);

  if (!id) {
    return jsonResponse({ success: false, message: '유효한 id가 필요합니다.' }, { status: 400 });
  }

  try {
    const db = new DB(env.DB);
    const content = await db
      .prepare(`SELECT * FROM contents WHERE id = ?1`)
      .bind(id)
      .first();

    if (!content) {
      return jsonResponse(
        { success: false, message: '콘텐츠를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return jsonResponse({ success: true, data: content }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch content:', error);
    return jsonResponse({ success: false, message: '콘텐츠 조회에 실패했습니다.' }, { status: 500 });
  }
}

export async function onRequestDelete({ params, env }) {
  const id = parseId(params?.id);

  if (!id) {
    return jsonResponse({ success: false, message: '유효한 id가 필요합니다.' }, { status: 400 });
  }

  try {
    const db = new DB(env.DB);
    const result = await db
      .prepare(`DELETE FROM contents WHERE id = ?1`)
      .bind(id)
      .run();

    if (!result || result.changes === 0) {
      return jsonResponse(
        { success: false, message: '삭제할 데이터가 없습니다.' },
        { status: 404 },
      );
    }

    return jsonResponse(
      {
        success: true,
        data: { message: '삭제 완료' },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Failed to delete content:', error);
    return jsonResponse({ success: false, message: '콘텐츠 삭제에 실패했습니다.' }, { status: 500 });
  }
}
