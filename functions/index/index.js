const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const errorResponse = (error) =>
  new Response(
    JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    },
  );

export const onRequestGet = async (context) => {
  try {
    const { DB } = context.env;
    const statement = DB.prepare('SELECT name FROM sqlite_master WHERE type = ?1').bind('table');
    const result = await statement.all();
    const rows = result?.results ?? [];

    return jsonResponse({ success: true, count: rows.length, data: rows });
  } catch (error) {
    // console.debug('[api] Failed to fetch tables', error)
    return errorResponse(error);
  }
};
