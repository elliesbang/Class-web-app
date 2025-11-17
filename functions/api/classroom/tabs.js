export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const classId = url.searchParams.get('class_id');

  if (!classId) {
    return new Response('Missing class_id', { status: 400 });
  }

  const db = env.DB;

  const { results } = await db
    .prepare(
      `SELECT DISTINCT type 
       FROM classroom_content 
       WHERE class_id = ?
       ORDER BY type ASC`
    )
    .bind(classId)
    .all();

  return Response.json(results ?? []);
}
