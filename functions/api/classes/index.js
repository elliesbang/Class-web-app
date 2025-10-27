/**
 * ✅ functions/classes/index.js
 * 수업 등록 / 조회 / 수정 / 삭제 통합 API
 * Cloudflare D1 (env.DB) 기반
 */

export const onRequestGet = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      // 단일 수업 조회
      const { results } = await env.DB.prepare(
        "SELECT * FROM classes WHERE id = ?"
      )
        .bind(id)
        .all();

      return new Response(
        JSON.stringify({ success: true, data: results[0] || null }),
        { headers: { "Content-Type": "application/json" } }
      );
    } else {
      // 전체 수업 조회
      const { results } = await env.DB.prepare("SELECT * FROM classes").all();
      return new Response(
        JSON.stringify({ success: true, data: results }),
        { headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
};

// ✅ 새 수업 등록 (POST)
export const onRequestPost = async ({ request, env }) => {
  try {
    const body = await request.json();
    const {
      name,
      code,
      category,
      startDate,
      endDate,
      methods,
      uploadType,
      uploadDays,
    } = body;

    if (!name || !code) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "필수 항목이 누락되었습니다.",
        }),
        { status: 400 }
      );
    }

    await env.DB.prepare(
      `INSERT INTO classes 
       (name, code, category, startDate, endDate, methods, uploadType, uploadDays)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        name || "",
        code || "",
        category || "",
        startDate || "",
        endDate || "",
        Array.isArray(methods) ? methods.join(",") : String(methods || ""),
        uploadType || "",
        Array.isArray(uploadDays) ? uploadDays.join(",") : String(uploadDays || "")
      )
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
};

// ✅ 수업 수정 (PUT)
export const onRequestPut = async ({ request, env }) => {
  try {
    const body = await request.json();
    const {
      id,
      name,
      code,
      category,
      startDate,
      endDate,
      methods,
      uploadType,
      uploadDays,
    } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: "id가 필요합니다." }),
        { status: 400 }
      );
    }

    await env.DB.prepare(
      `UPDATE classes
       SET name = ?, code = ?, category = ?, startDate = ?, endDate = ?, 
           methods = ?, uploadType = ?, uploadDays = ?
       WHERE id = ?`
    )
      .bind(
        name || "",
        code || "",
        category || "",
        startDate || "",
        endDate || "",
        Array.isArray(methods) ? methods.join(",") : String(methods || ""),
        uploadType || "",
        Array.isArray(uploadDays) ? uploadDays.join(",") : String(uploadDays || ""),
        id
      )
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
};

// ✅ 수업 삭제 (DELETE)
export const onRequestDelete = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: "id가 필요합니다." }),
        { status: 400 }
      );
    }

    await env.DB.prepare("DELETE FROM classes WHERE id = ?").bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
};
