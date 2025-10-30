import { getDB } from '../_db';

/**
 * ✅ Cloudflare Pages Functions 전용 D1 초기화 버전
 */
export const ensureDb = async (context) => {
  const DB = getDB(context?.env ?? {});
  if (!DB || typeof DB.prepare !== "function") {
    console.error("❌ D1 Database binding(DB) is invalid:", DB);
    throw new Error("D1 Database binding(DB)이 유효하지 않습니다. wrangler.toml의 [[d1_databases]] 설정을 확인하세요.");
  }

  await DB.batch([
    DB.prepare(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,
        code TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `),
  ]);

  return DB;
};

/**
 * ✅ 정상 응답 포맷
 */
export const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

/**
 * ✅ 오류 응답 포맷
 */
export const errorResponse = (error, status = 500) => {
  const message =
    error instanceof Error ? error.message : String(error ?? "Unknown error");
  return new Response(
    JSON.stringify({ success: false, error: message }),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
};

/**
 * ✅ 공통 에러 핸들러
 */
export const handleError = (error) => {
  console.error("❌ API Error:", error);
  return errorResponse(error);
};
