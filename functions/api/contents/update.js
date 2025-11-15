import DB from '../utils/db';

export async function onRequestPut(context) {
  const db = new DB(context.env.DB);
  const body = await context.request.json();
  const { id, class_id, type, title, description, file_url } = body;

  try {
    await db.run(
      `UPDATE contents
          SET class_id = ?, type = ?, title = ?, description = ?, file_url = ?, updated_at = datetime('now')
        WHERE id = ?`,
      [class_id, type, title, description || '', file_url || '', id]
    );

    const record = await db.first('SELECT * FROM contents WHERE id = ?', [id]);

    return new Response(
      JSON.stringify({ success: true, data: record ? [record] : [] }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    console.error('콘텐츠 수정 오류:', err);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}
