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
    const {
      title,
      video_url,
      description,
      category_id,
      display_order,
      is_recommended,
      thumbnail_url
    } = body;

    if (!title || !video_url) {
      return new Response(
        JSON.stringify({ error: "title and video_url are required" }),
        { status: 400 }
      );
    }

    // Supabase Cloudflare Client
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false },
        global: { fetch }
      }
    );

    // Insert into vod_videos
    const { data, error } = await supabase
      .from("vod_videos")
      .insert({
        title,
        url: video_url,
        description: description || null,
        category_id: category_id ? Number(category_id) : null,
        order_num: display_order ? Number(display_order) : null,
        is_recommended: is_recommended ?? false,
        thumbnail_url: thumbnail_url || null
      })
      .select()
      .single();

    if (error) {
      console.error("[vod_videos/save] DB Error:", error);
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
    console.error("[vod_videos/save] Internal Error:", err);
    return new Response(JSON.stringify({ error: "Internal Error" }), {
      status: 500
    });
  }
}