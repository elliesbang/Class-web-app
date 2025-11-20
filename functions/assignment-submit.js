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

    // 🔥 MUST for Cloudflare Worker
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      global: { fetch: fetch }
    });

    let uploadedImageUrl = null;

    // -------------------------
    // 🔥 Base64 업로드 처리
    // -------------------------
    if (image_base64) {
      const base64String = image_base64.split(",")[1];

      // Cloudflare-safe base64 → binary 변환
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const filePath = `assignments/${classroom_id}/${student_id}/${Date.now()}.png`;

      // Blob으로 업로드 (Cloudflare 호환)
      const blob = new Blob([bytes], { type: "image/png" });

      const { error: uploadError } = await supabase.storage
        .from("assignments")
        .upload(filePath, blob, {
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) {
        console.error("uploadError:", uploadError);
        return new Response("Image upload failed", { status: 500 });
      }

      const { data } = supabase.storage
        .from("assignments")
        .getPublicUrl(filePath);

      uploadedImageUrl = data.publicUrl;
    }

    // -------------------------
    // 🔥 DB insert
    // -------------------------
    const { error: dbError } = await supabase.from("assignments").insert({
      classroom_id,
      student_id,
      session_no,
      image_url: uploadedImageUrl,
      link_url: link_url || null
    });

    if (dbError) {
      console.error("dbError:", dbError);
      return new Response("DB insert failed", { status: 500 });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Internal Error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}