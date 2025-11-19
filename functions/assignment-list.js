import { createClient } from "@supabase/supabase-js";

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const classId = url.searchParams.get("class_id");

    if (!classId) {
      return new Response("Missing class_id", { status: 400 });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      global: { fetch: fetch }
    });

    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("classroom_id", classId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[assignment-list] DB error", error);
      return new Response("DB fetch failed", { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[assignment-list] Internal Error", err);
    return new Response("Internal Error", { status: 500 });
  }
}