import { DB } from '../../_db';

export async function onRequestGet(context) {
  try {
    const { id } = context.params; // class_id
    const url = new URL(context.request.url);
    const type = url.searchParams.get('type');

    let query = `SELECT * FROM contents WHERE class_id = ?`;
    if (type) query += ` AND type = ? ORDER BY created_at DESC`;
    else query += ` ORDER BY created_at DESC`;

    const results = type
      ? await DB.prepare(query).bind(id, type).all()
      : await DB.prepare(query).bind(id).all();

    return Response.json({ success: true, data: results.results });
  } catch (err) {
    return Response.json({ success: false, error: err.message });
  }
}
