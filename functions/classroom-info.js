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

    // 기본 정보
    const { data: classroom, error: classroomError } = await supabase
      .from("classroom")
      .select("*")
      .eq("id", classroomId)
      .single()

    if (classroomError || !classroom) {
      return new Response(
        JSON.stringify({ error: "Failed to load classroom info" }),
        { status: 400 }
      )
    }

    // Sessions 가져오기
    const { data: sessions } = await supabase
      .from("classroom_sessions")
      .select("*")
      .eq("classroom_id", classroomId)
      .order("session_no", { ascending: true })

    return new Response(
      JSON.stringify({
        classroom,
        sessions: sessions ?? []
      }),
      { status: 200 }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}