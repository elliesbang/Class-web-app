import { DB } from '../../_db';

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // optional filter

    let query = `SELECT * FROM contents`;
    if (type) query += ` WHERE type = ? ORDER BY created_at DESC`;
    else query += ` ORDER BY created_at DESC`;

    const results = type
      ? await DB.prepare(query).bind(type).all()
      : await DB.prepare(query).all();

    return Response.json({ success: true, data: results.results });
  } catch (err) {
    return Response.json({ success: false, error: err.message });
  }
}
