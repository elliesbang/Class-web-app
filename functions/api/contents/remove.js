import DB from '../utils/db';

export async function onRequestDelete(context) {
  const db = new DB(context.env.DB);
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');

  try {
    await db.run('DELETE FROM contents WHERE id = ?', [id]);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('콘텐츠 삭제 오류:', err);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}
