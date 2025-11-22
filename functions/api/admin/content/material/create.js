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
    const { classroom_id, title, file_url, file_name, display_order } = body;

    if (!classroom_id || !title || !file_url) {
      return new Response(
        JSON.stringify({ error: "classroom_id, title, and file_url are required" }),
        { status: 400 }
      );
    }

    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false },
        global: { fetch }
      }
    );

    const { data, error } = await supabase
      .from("classroom_materials")
      .insert({
        classroom_id: Number(classroom_id),
        title,
        file_url,
        file_name: file_name || null,
        order_num: display_order ? Number(display_order) : null
      })
      .select()
      .single();

    if (error) {
      console.error("[classroom_materials/save] DB Error:", error);
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
    console.error("[classroom_materials/save] Internal Error:", err);
    return new Response(JSON.stringify({ error: "Internal Error" }), {
      status: 500
    });
  }
}