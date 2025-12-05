import { createClient } from "@supabase/supabase-js";

export async function onRequest({ request, env }) {
  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const rawAuth =
      request.headers.get('authorization') ||
      request.headers.get('Authorization');

    const token =
      rawAuth?.replace('Bearer ', '') ||
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      null;

    if (!token) return new Response(JSON.stringify({ assignments: [] }), { status: 200 });

    const { data: auth } = await supabase.auth.getUser(token);
    const studentId = auth?.user?.id ?? null;
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id') || searchParams.get('classId');

    if (!studentId || !classId)
      return new Response(JSON.stringify({ assignments: [] }), { status: 200 });

    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .order("created_at", { ascending: false })
      .limit(10);

    return new Response(JSON.stringify({ assignments: data ?? [] }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ assignments: [] }), { status: 500 });
  }
};
