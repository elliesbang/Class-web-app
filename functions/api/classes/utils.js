/**
 * ✅ Cloudflare D1 Database 초기화 (완전 호환 버전)
 */
export const ensureDb = async (context) => {
  const { env } = context ?? {};
  const DB = env?.DB;
  if (!DB || typeof DB.prepare !== "function") {
    throw new Error("D1 Database binding(DB)이 올바르지 않습니다.");
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
 * ✅ JSON 응답 헬퍼
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
 * ✅ 오류 응답 헬퍼
 */
export const errorResponse = (error, status = 500) => {
  const message =
    error instanceof Error ? error.message : String(error ?? "Unknown error");

  return new Response(
    JSON.stringify({
      success: false,
      error: message,
    }),
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
