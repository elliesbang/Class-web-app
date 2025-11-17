export async function onRequest({ env }) {
  const db = env.DB;
  const result = await db.prepare('SELECT * FROM CLASSROOM_LIST ORDER BY sort_order ASC').all();
  return Response.json(result);
}
