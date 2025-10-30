// 🔄 Force Cloudflare Functions redeploy - ${new Date().toISOString()}
import { getDB } from "../_db";

export const onRequestGet = async (context) => {
  try {
    const DB = getDB(context.env);
    const { results } = await DB.prepare(`
      SELECT id, name
      FROM categories
      ORDER BY id ASC
    `).all();

    return Response.json(results, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }
};
