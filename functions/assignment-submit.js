import { createClient } from "@supabase/supabase-js";

export async function onRequest({ request, env }) {
  try {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await request.json();
    let { classroom_id, student_id, session_no, image_base64, link_url } = body;

    // -----------------------------
    // 🔥 필수값 체크
    // -----------------------------
    if (!classroom_id || !student_id || !session_no) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Cloudflare Request에서는 session_no가 string이라 integer로 변환해야 Supabase 오류 안 남
    session_no = Number(session_no);

    // -----------------------------
    // 🔥 Supabase client
    // -----------------------------
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      global: { fetch: fetch }
    });

    let uploadedImageUrl = null;

    // -----------------------------
    // 🔥 Base64 이미지 → File 업로드 (Cloudflare 호환)
    // -----------------------------
    if (image_base64) {
      const base64String = image_base64.split(",")[1];

      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const file = new File([bytes], `assignment_${Date.now()}.png`, {
        type: "image/png",
      });

      const filePath = `assignments/${classroom_id}/${student_id}/${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("assignments")
        .upload(filePath, file, {
          upsert: false,
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

    // -----------------------------
    // 🔥 DB INSERT
    // -----------------------------
    const { error: dbError } = await supabase.from("assignments").insert({
      classroom_id,
      student_id,
      session_no,
      image_url: uploadedImageUrl,
      link_url: link_url || null,
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