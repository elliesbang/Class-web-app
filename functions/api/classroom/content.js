import { createClient } from "@supabase/supabase-js";

const getClient = (env) =>
  createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export const onRequest = async ({ request, env }) => {
  try {
    const supabase = getClient(env);
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return new Response(JSON.stringify({ error: "missing classId" }), {
        status: 400,
      });
    }

    const [videos, materials, notices] = await Promise.all([
      supabase.from("class_videos").select("*").eq("class_id", classId),
      supabase.from("class_materials").select("*").eq("class_id", classId),
      supabase.from("class_notices").select("*").eq("class_id", classId),
    ]);

    return new Response(
      JSON.stringify({
        videos: videos.data ?? [],
        materials: materials.data ?? [],
        notices: notices.data ?? [],
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
