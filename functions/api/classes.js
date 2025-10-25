export async function onRequestPost(context) {
  const { env } = context;

  try {
    const data = await context.request.json();
    console.log("📦 Received Data:", data);

    const { name, category_id, start_date, end_date, upload_limit, upload_day, code } = data;

    // 필수값 누락 여부 확인
    if (!name || !category_id) {
      throw new Error("Missing required fields");
    }

    await env.DB.prepare(`
      INSERT INTO classes (name, category_id, start_date, end_date, upload_limit, upload_day, code, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(name, category_id, start_date, end_date, upload_limit, upload_day, code, new Date().toISOString())
    .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ DB Insert Error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to insert class", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
