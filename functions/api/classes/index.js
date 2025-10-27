/**
 * ✅ Classes API 기본 연결 테스트
 * Cloudflare Pages + D1 연동 확인용
 */

export const onRequestGet = async (context) => {
  try {
    // DB 바인딩 확인 (D1 연결 테스트)
    const { DB } = context.env;

    // 테이블이 존재하는 경우, 샘플 쿼리
    const result = await DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' LIMIT 5"
    ).all();

    // 결과 반환
    return new Response(
      JSON.stringify({
        status: "✅ API 연결 성공",
        message: "Classes API 정상 작동 중",
        tables: result?.results || [],
      }),
      {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  } catch (error) {
    // 오류 처리
    return new Response(
      JSON.stringify({
        status: "❌ 오류 발생",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
