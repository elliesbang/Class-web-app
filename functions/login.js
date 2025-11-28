import { createClient } from '@supabase/supabase-js'

const getSupabaseClient = (env) => {
  const url = env.SUPABASE_URL
  const anon = env.SUPABASE_ANON_KEY
  return createClient(url, anon)
}

export const onRequest = async ({ request, env }) => {
  try {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      })
    }

    const { email, password } = await request.json()
    const supabase = getSupabaseClient(env)

    // 1) 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    if (!data.session || !data.user) {
      return new Response(JSON.stringify({ error: "세션 없음" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    }

    const user = data.user
    const token = data.session.access_token

    // 2) 프로필 조회 — role 반드시 필요
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name, role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "프로필 조회 실패" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    }

    // 3) 최종 응답 — LoginForm이 요구하는 구조
    return new Response(
      JSON.stringify({
        success: true,
        user,
        profile,
        token
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}