import DB from '../_db';

export async function onRequestPost(context) {
  const db = new DB(context.env.DB);
  const body = await context.request.json();
  const { class_id, type, title, description, file_url } = body;

  try {
    const result = await db.run(
      `INSERT INTO contents (class_id, type, title, description, file_url, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [class_id, type, title, description || '', file_url || '']
    );

    const insertedId = result?.meta?.last_row_id;
    const record = insertedId
      ? await db.first('SELECT * FROM contents WHERE id = ?', [insertedId])
      : null;

    return new Response(
      JSON.stringify({ success: true, data: record ? [record] : [] }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 201,
      }
    );
  } catch (err) {
    console.error('콘텐츠 저장 오류:', err);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}
