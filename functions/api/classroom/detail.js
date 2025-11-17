export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const classId = url.searchParams.get('class_id');
  if (!classId) {
    return new Response('Missing class_id', { status: 400 });
  }
  const db = env.DB;
  const result = await db.prepare('SELECT * FROM CLASSROOM_DETAIL WHERE class_id = ?').bind(classId).all();
  return Response.json(result);
}
