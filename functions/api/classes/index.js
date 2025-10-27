/**
 * 🎯 Classes API - 목록 조회 / 추가 / 삭제 (최종 통합 버전)
 * Cloudflare Pages + D1 Database
 */

export const onRequestGet = async (context) => {
  try {
    const { DB } = context.env;

    // ✅ 수업 목록 조회 (카테고리명 JOIN)
    const { results } = await DB.prepare(`
      SELECT 
        c.id,
        c.name AS class_name,
        cat.name AS category_name,
        c.code,
        c.upload_limit,
        c.upload_day,
        c.created_at
      FROM classes c
      LEFT JOIN categories cat ON c.category_id = cat.id
      ORDER BY c.created_at DESC
    `).all();

    return Response.json(results, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ status: "error", message: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }
};

/**
 * 🆕 새 수업 등록 (POST)
 * - 프론트에서 category_id가 "이름"으로 들어와도 자동 변환
 * - name, category_id는 필수
 */
export const onRequestPost = async (context) => {
  try {
    const { DB } = context.env;
    const body = await context.request.json();

    let {
      name = "",
      category_id,
      code = "",
      upload_limit = "",
      upload_day = "",
    } = body;

    const safeName = typeof name === "string" ? name : String(name ?? "");
    const safeCode = typeof code === "string" ? code : String(code ?? "");
    const safeUploadLimit = Array.isArray(upload_limit)
      ? upload_limit.join(",")
      : String(upload_limit ?? "");
    const safeUploadDay = Array.isArray(upload_day)
      ? upload_day.join(",")
      : String(upload_day ?? "");

    // ✅ 카테고리 이름이 들어올 경우 자동으로 ID 변환
    if (category_id === undefined || category_id === null) {
      category_id = "";
    }

    if (
      typeof category_id === "string" &&
      category_id.trim() !== "" &&
      isNaN(Number(category_id))
    ) {
      const categoryLookup = await DB.prepare(
        "SELECT id FROM categories WHERE name = ?"
      )
        .bind(category_id)
        .first();

      if (!categoryLookup) {
        return new Response(
          JSON.stringify({
            status: "error",
            message: `해당 카테고리(${category_id})를 찾을 수 없습니다.`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json; charset=utf-8" },
          }
        );
      }

      category_id = categoryLookup.id;
    }
    if (category_id && !isNaN(Number(category_id))) {
      category_id = Number(category_id);
    }

    const hasCategoryId =
      typeof category_id === "number" ? !Number.isNaN(category_id) : !!category_id;

    // ✅ 필수 항목 체크
    if (!safeName || !hasCategoryId) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "필수 항목이 누락되었습니다.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }

    // ✅ DB 삽입
    await DB.prepare(`
      INSERT INTO classes (name, category_id, code, upload_limit, upload_day, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
      .bind(
        safeName,
        category_id ?? "",
        safeCode,
        safeUploadLimit,
        safeUploadDay
      )
      .run();

    return new Response(
      JSON.stringify({
        status: "success",
        message: "수업 등록이 완료되었습니다.",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ status: "error", message: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }
};

/**
 * 🗑️ 수업 삭제 (DELETE)
 * - /api/classes?id=3 형태로 호출
 */
export const onRequestDelete = async (context) => {
  try {
    const { DB } = context.env;
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ status: "error", message: "수업 ID가 없습니다." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }

    await DB.prepare("DELETE FROM classes WHERE id = ?").bind(id).run();

    return new Response(
      JSON.stringify({
        status: "success",
        message: `수업 ${id} 삭제 완료`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ status: "error", message: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }
};
