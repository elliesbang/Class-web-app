export async function onRequestGet(context) {
  const { env } = context;

  try {
    const { results } = await env.DB.prepare(`
      SELECT c.id, c.name, c.code, c.category_id, cat.name AS category_name
      FROM classes c
      LEFT JOIN categories cat ON c.category_id = cat.id
      ORDER BY c.category_id ASC, c.id ASC
    `).all();

    return new Response(JSON.stringify(results || []), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ DB Fetch Error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to load classes" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
