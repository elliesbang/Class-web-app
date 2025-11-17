export async function onRequest({ env }) {
  const db = env.DB;

  const { results } = await db
    .prepare(
      `SELECT 
          id,
          name,
          code,
          category,
          startDate,
          endDate,
          assignmentUploadTime,
          assignmentUploadDays,
          isActive,
          createdAt,
          updatedAt
       FROM classes
       ORDER BY createdAt DESC`
    )
    .all();

  return new Response(JSON.stringify({ results }), {
    headers: { "Content-Type": "application/json" },
  });
}