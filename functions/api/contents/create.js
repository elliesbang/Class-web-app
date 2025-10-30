import { DB } from '../../_db';

export async function onRequestPost({ request }) {
  try {
    const body = await request.json();
    const { title, type, url, class_id } = body;

    const result = await DB.prepare(
      `INSERT INTO contents (title, type, url, class_id, created_at)
       VALUES (?, ?, ?, ?, datetime('now', 'localtime'))`
    ).bind(title, type, url, class_id).run();

    return Response.json({ success: true, result });
  } catch (err) {
    return Response.json({ success: false, error: err.message });
  }
}
