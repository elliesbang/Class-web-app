/**
 * ✅ 공통 JSON 응답 헬퍼
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
 * ❌ 공통 에러 응답 헬퍼
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
 * 🧩 DB 스키마 보장 함수 (선택적으로 유지)
 * → 다른 곳에서 ensureBaseSchema() 불러올 때 사용됨
 */
export const ensureBaseSchema = async (DB) => {
  await DB.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};
