import { createClient } from "@supabase/supabase-js";

export async function onRequest({ request, env }) {
  try {
    const url = new URL(request.url);
    let classId = url.searchParams.get("class_id");

    if (!classId) {
      return new Response("Missing class_id", { status: 400 });
    }

    // 🔥 Supabase integer 매칭 문제 해결
    classId = Number(classId);

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      global: { fetch: fetch }
    });

    // 🔥 created_at 없을 때 오류 방지
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("classroom_id", classId)
      .order("created_at", { ascending: false })
      .throwOnError(false);

    if (error) {
      console.error("[assignment-list] DB error:", error);

      // created_at 오류일 경우 대응
      if (error.message?.includes("created_at")) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("assignments")
          .select("*")
          .eq("classroom_id", classId);

        if (fallbackError) {
          console.error("[assignment-list] fallback DB error:", fallbackError);
          return new Response("DB fetch failed", { status: 500 });
        }

        return new Response(JSON.stringify(fallbackData), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response("DB fetch failed", { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("[assignment-list] Internal Error", err);
    return new Response("Internal Error", { status: 500 });
  }
}