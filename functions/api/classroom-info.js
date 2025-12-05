import { createClient } from "@supabase/supabase-js";

const getClient = (env) =>
  createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export async function onRequest({ request, env }) {
  try {
    const supabase = getClient(env);

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("class_id") || searchParams.get("classId");

    if (!classId) {
      return new Response(JSON.stringify({ error: "missing classId" }), {
        status: 400,
      });
    }

    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("id", classId)
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
