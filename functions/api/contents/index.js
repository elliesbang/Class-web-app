import DB from '../utils/db';

export async function onRequestGet(context) {
  const db = new DB(context.env.DB);
  const url = new URL(context.request.url);
  const classId = url.searchParams.get('class_id');

  try {
    const { results } = await db.all(
      'SELECT * FROM contents WHERE class_id = ? ORDER BY created_at DESC',
      [classId]
    );

    return new Response(JSON.stringify({ success: true, data: results }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      status: 200,
    });
  } catch (err) {
    console.error('콘텐츠 목록 오류:', err);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}

/**
 * 콘텐츠 생성
 */
export async function onRequestPost(context) {
  const db = new DB(context.env.DB);
  const body = await context.request.json();

  const { id, class_id, title, video_url, description } = body;

  try {
    await db.run(
      `INSERT INTO contents (id, class_id, title, video_url, description, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [id, class_id, title, video_url, description]
    );

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (err) {
    console.error('콘텐츠 생성 오류:', err);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}

/**
 * 콘텐츠 삭제
 */
export async function onRequestDelete(context) {
  const db = new DB(context.env.DB);
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ success: false, message: 'id is required' }), {
      status: 400,
    });
  }

  try {
    await db.run(`DELETE FROM contents WHERE id = ?`, [id]);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('콘텐츠 삭제 오류:', err);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}
