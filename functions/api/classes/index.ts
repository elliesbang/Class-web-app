export async function onRequest({ env }) {
  const db = env.DB;

  const { results } = await db
    .prepare(
      `SELECT 
          id,
          name,
          code,
          category,
          category_id,
          start_date,
          end_date,
          duration,
          assignment_upload_time,
          assignment_upload_days,
          delivery_methods,
          is_active,
          created_at,
          updated_at
       FROM classes
       ORDER BY created_at DESC`
    )
    .all();

  return new Response(JSON.stringify({ results }), {
    headers: { "Content-Type": "application/json" },
  });
}
