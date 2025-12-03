import { createClient } from "@supabase/supabase-js";

export async function onRequest({ request, env }) {
  try {
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method Not Allowed" }),
        { status: 405 }
      );
    }

    const body = await request.json();
    const { title, content, isVisible } = body;

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: "title and content are required" }),
        { status: 400 }
      );
    }

    // Cloudflare Pages 전용 Supabase Client
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false },
        global: { fetch }
      }
    );

    // 전체 공지 저장
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        title,
        content,
        is_visible: typeof isVisible === "boolean" ? isVisible : true,
      })
      .select()
      .single();

    if (error) {
      console.error("[notifications/save] DB Error:", error);
      return new Response(
        JSON.stringify({ error: "DB insert failed", detail: error.message }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("[notifications/save] Internal Error:", err);
    return new Response(JSON.stringify({ error: "Internal Error" }), {
      status: 500
    });
  }
}
