import { createClient } from "@supabase/supabase-js";

export async function onRequest(context) {
  try {
    const { request, env } = context;

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await request.json();
    const { classroom_id, student_id, session_no, image_base64, link_url } = body;

    if (!classroom_id || !student_id || !session_no) {
      return new Response("Missing required fields", { status: 400 });
    }

    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    let uploadedImageUrl = null;

    if (image_base64) {
      const base64Data = image_base64.split(",")[1];
      const binary = Uint8Array.from(atob(base64Data), (c) =>
        c.charCodeAt(0)
      );

      const filePath = `assignments/${classroom_id}/${student_id}/${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("assignments")
        .upload(filePath, binary, {
          cacheControl: "3600",
          contentType: "image/png",
          upsert: false
        });

      if (uploadError) {
        console.error(uploadError);
        return new Response("Image upload failed", { status: 500 });
      }

      const { data } = supabase.storage
        .from("assignments")
        .getPublicUrl(filePath);

      uploadedImageUrl = data.publicUrl;
    }

    const { error: dbError } = await supabase.from("assignments").insert({
      classroom_id,
      student_id,
      session_no,
      image_url: uploadedImageUrl,
      link_url: link_url || null
    });

    if (dbError) {
      console.error(dbError);
      return new Response("DB insert failed", { status: 500 });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
