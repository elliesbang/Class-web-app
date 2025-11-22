import { createClient } from "@supabase/supabase-js";

export async function onRequest({ request, env }) {
  try {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await request.json();
    const { classroom_id, session_no, image_base64, link_url } = body;

    if (!classroom_id || !session_no) {
      return new Response("Missing fields", { status: 400 });
    }

    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response("Unauthenticated", { status: 401 });
    }

    let uploadedImageUrl = null;

    if (image_base64) {
      const base64Data = image_base64.split(",")[1];
      const buffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

      const filePath = `assignments/${classroom_id}/${user.id}/${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("assignments")
        .upload(filePath, buffer, {
          contentType: "image/png",
        });

      if (uploadError) {
        return new Response(JSON.stringify({ error: "Upload failed" }), {
          status: 500,
        });
      }

      uploadedImageUrl = supabase.storage
        .from("assignments")
        .getPublicUrl(filePath).data.publicUrl;
    }

    // DB insert
    const { error } = await supabase.from("assignments").insert({
      classroom_id,
      student_id: user.id,
      session_no,
      image_url: uploadedImageUrl,
      link_url,
    });

    if (error) {
      return new Response(JSON.stringify({ error: "Insert failed" }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}