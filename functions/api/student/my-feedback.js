import { createClient } from "@supabase/supabase-js";

export const onRequest = async ({ request, env }) => {
  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const rawAuth =
      request.headers.get('authorization') ||
      request.headers.get('Authorization');

    const token =
      rawAuth?.replace('Bearer ', '') ||
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      null;

    if (!token) return new Response(JSON.stringify({ feedback: [] }), { status: 200 });

    const { data: auth } = await supabase.auth.getUser(token);
    const studentId = auth?.user?.id ?? null;

    if (!studentId) return new Response(JSON.stringify({ feedback: [] }), { status: 200 });

    const { data, error } = await supabase
      .from("assignment_feedback")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(10);

    return new Response(JSON.stringify({ feedback: data ?? [] }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ feedback: [] }), { status: 500 });
  }
};
