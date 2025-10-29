/**
 * ✅ DB 연결 보장 함수 (Cloudflare D1 전용)
 * exec() 대신 batch()를 사용해야 합니다.
 */
export const ensureDb = async (DB) => {
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
 * ❌ 오류 응답 포맷
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
 * ⚙️ 공통 에러 핸들러
 */
export const handleError = (error) => {
  console.error("❌ API Error:", error);
  return errorResponse(error);
};
