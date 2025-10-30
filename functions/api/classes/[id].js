import { getDB } from '../_db';

export async function onRequestGet(context) {
  const { params } = context;
  const { id } = params;
  try {
    const DB = getDB(context.env);
    const result = await DB.prepare('SELECT * FROM classes WHERE id = ?').bind(id).first();
    return Response.json(result);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { params } = context;
  const { id } = params;
  const DB = getDB(context.env);
  const data = await context.request.json();
  const { title, category_id, duration, upload_time, type } = data;

  try {
    await DB.prepare(
      'UPDATE classes SET title=?, category_id=?, duration=?, upload_time=?, type=? WHERE id=?'
    ).bind(title, category_id, duration, upload_time, type, id).run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { params } = context;
  const { id } = params;
  try {
    const DB = getDB(context.env);
    await DB.prepare('DELETE FROM classes WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
