import { DB } from '../../_db';

export async function onRequestGet() {
  try {
    const result = await DB.prepare('SELECT * FROM classes ORDER BY id DESC').all();
    return Response.json(result.results);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestPost({ request }) {
  try {
    const data = await request.json();
    const { title, category_id, duration, upload_time, type } = data;

    await DB.prepare(
      'INSERT INTO classes (title, category_id, duration, upload_time, type) VALUES (?, ?, ?, ?, ?)'
    ).bind(title, category_id, duration, upload_time, type).run();

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
