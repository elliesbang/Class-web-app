import { z } from 'zod';

const relaxedStringSchema = z.preprocess(
  (value) => {
    if (value == null) {
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    const stringified = String(value).trim();
    return stringified.length > 0 ? stringified : null;
  },
  z.string().optional().nullable(),
);

const parseOptionalString = (value) => {
  const result = relaxedStringSchema.safeParse(value);
  if (!result.success) {
    return null;
  }

  return result.data ?? null;
};

export async function onRequestGet(context) {
  try {
    // D1 데이터베이스 인스턴스 가져오기
    const db = context.env.DB;

    // class_categories 테이블에서 id, name 순으로 정렬된 결과 가져오기
    const { results } = await db.prepare(`
      SELECT id, name
      FROM class_categories
      ORDER BY id ASC;
    `).all();

    // 응답 반환 (UTF-8 JSON)
    const normalisedResults = (results ?? []).map((row) => ({
      ...row,
      name: parseOptionalString(row?.name),
    }));

    return new Response(JSON.stringify(normalisedResults, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    // 에러 처리
    console.error("❌ Error fetching class categories:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch class categories", details: err.message }),
      { status: 500, headers: { "content-type": "application/json; charset=utf-8" } }
    );
  }
}
