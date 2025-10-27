/**
 * 🗑️ 경로 기반 DELETE: /api/classes/3
 */
export const onRequestDelete = async (context) => {
  try {
    const { DB } = context.env;
    const id = context.params.id; // ✅ URL 경로에서 id 추출

    await DB.prepare("DELETE FROM classes WHERE id = ?").bind(id).run();

    return new Response(
      JSON.stringify({ status: "success", message: `수업 ${id} 삭제 완료` }),
      { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ status: "error", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
};
