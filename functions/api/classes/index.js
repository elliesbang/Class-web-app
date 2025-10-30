const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export async function onRequestGet({ env }) {
  try {
    const statement = env.DB.prepare(`
      SELECT id, name, category_id, start_date, end_date, upload_limit,
             upload_day, code, category, duration, created_at
        FROM classes
    ORDER BY created_at DESC
    `);

    const { results } = await statement.all();

    return new Response(
      JSON.stringify({ success: true, data: results ?? [] }),
      {
        status: 200,
        headers: JSON_HEADERS,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: JSON_HEADERS,
      }
    );
  }
}
