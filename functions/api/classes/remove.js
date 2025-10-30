const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export async function onRequestDelete({ request, env }) {
  const url = new URL(request.url);
  const rawId = url.searchParams.get("id");
  const id = Number(rawId);

  if (!rawId || Number.isNaN(id) || !Number.isInteger(id) || id <= 0) {
    return new Response(
      JSON.stringify({ success: false, message: "삭제할 수업 ID가 없습니다." }),
      {
        status: 400,
        headers: JSON_HEADERS,
      }
    );
  }

  try {
    const result = await env.DB.prepare(`
      DELETE FROM classes
       WHERE id = ?1
    `)
      .bind(id)
      .run();

    if (!result.meta || result.meta.changes === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "해당 수업을 찾을 수 없습니다." }),
        {
          status: 404,
          headers: JSON_HEADERS,
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "수업이 삭제되었습니다." }),
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
