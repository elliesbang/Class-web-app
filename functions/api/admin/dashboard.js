// 🔄 Force Cloudflare Functions redeploy - ${new Date().toISOString()}
import { getDB } from "../_db";

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
    const DB = getDB(context.env);
    const { CLOUDFLARE_API_TOKEN, DATABASE_ID, DATABASE_NAME } = context.env;

    if (!CLOUDFLARE_API_TOKEN || !DATABASE_ID || !DATABASE_NAME || !DB) {
      return jsonResponse(
        { success: false, count: 0, data: [], message: '환경변수를 불러오지 못했습니다.' },
        500,
      );
    }

    const result = await DB.prepare('SELECT * FROM classes').all();
    const rows = result?.results ?? [];

    return jsonResponse({ success: true, count: rows.length, data: rows });
  } catch (error) {
    // console.debug('[admin-dashboard] Failed to load dashboard data', error)
    return errorResponse(error);
  }
};
