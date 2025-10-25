export async function onRequestGet(context) {
  const { env } = context;

  try {
    const { results } = await env.DB.prepare(`
      SELECT 
        c.id,
        c.name,
        c.category_id,
        c.start_date,
        c.end_date,
        c.upload_limit,
        c.upload_day,
        c.code,
        c.created_at,
        COALESCE(cat.name, '미지정') AS category_name
      FROM classes c
      LEFT JOIN categories cat 
        ON c.category_id = cat.id
      ORDER BY c.id ASC
    `).all();

    return new Response(JSON.stringify(results || []), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("❌ DB Fetch Error (classes):", err);
    return new Response(
      JSON.stringify({
        error: "Failed to load classes",
        details: err.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
