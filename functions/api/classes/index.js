import { getDB } from '../_db';

export async function onRequestGet(context) {
  try {
    const DB = getDB(context.env);
    const result = await DB.prepare('SELECT * FROM classes ORDER BY id DESC').all();
    return Response.json(result.results);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestPost(context) {
  try {
    const DB = getDB(context.env);
    const data = await context.request.json();
    const { title, category_id, duration, upload_time, type } = data;

    await DB.prepare(
      'INSERT INTO classes (title, category_id, duration, upload_time, type) VALUES (?, ?, ?, ?, ?)'
    ).bind(title, category_id, duration, upload_time, type).run();

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
