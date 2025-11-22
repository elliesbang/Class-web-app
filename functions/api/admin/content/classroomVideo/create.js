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
    const { classroom_id, title, video_url, description, display_order } = body;

    if (!classroom_id || !title || !video_url) {
      return new Response(
        JSON.stringify({ error: "classroom_id, title, and video_url are required" }),
        { status: 400 }
      );
    }

    // Cloudflare Pages 전용 Supabase Client
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false },
        global: { fetch: fetch }
      }
    );

    const { data, error } = await supabase
      .from("classroom_videos")
      .insert({
        classroom_id: Number(classroom_id),
        title,
        url: video_url,
        description: description || null,
        order_num: display_order ? Number(display_order) : null
      })
      .select()
      .single();

    if (error) {
      console.error("[classroom_videos/save] DB Error:", error);
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
    console.error("[classroom_videos/save] Internal Error:", err);
    return new Response(JSON.stringify({ error: "Internal Error" }), {
      status: 500
    });
  }
}