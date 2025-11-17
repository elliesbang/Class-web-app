export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const classId = url.searchParams.get('class_id');
  const tab = url.searchParams.get('tab');
  if (!classId || !tab) {
    return new Response('Missing class_id or tab', { status: 400 });
  }
  const db = env.DB;
  const result = await db
    .prepare('SELECT * FROM CLASSROOM_CONTENT WHERE class_id = ? AND tab = ? ORDER BY sort_order ASC')
    .bind(classId, tab)
    .all();
  return Response.json(result);
}
