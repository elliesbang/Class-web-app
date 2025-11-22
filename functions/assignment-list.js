import { createClient } from '@supabase/supabase-js'

export async function onRequest({ request, env }) {
  try {
    const url = new URL(request.url)
    const classroomId = url.searchParams.get("classroomId")

    if (!classroomId) {
      return new Response(JSON.stringify({ error: "Missing classroomId" }), { status: 400 })
    }

    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 로그인 사용자
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 })
    }

    // 과제 목록 조회
    const { data: list, error: listError } = await supabase
      .from("assignments")
      .select("*")
      .eq("classroom_id", classroomId)
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })

    if (listError) {
      return new Response(
        JSON.stringify({ error: "Failed to load assignment list" }),
        { status: 400 }
      )
    }

    return new Response(
      JSON.stringify({ assignments: list ?? [] }),
      { status: 200 }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}