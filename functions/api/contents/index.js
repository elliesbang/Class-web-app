import DB from '../_db';

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
