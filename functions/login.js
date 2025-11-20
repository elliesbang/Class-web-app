import { createClient } from '@supabase/supabase-js'

const getSupabaseClient = (env) => {
  const url = env.SUPABASE_URL
  const anon = env.SUPABASE_ANON_KEY
  return createClient(url, anon)
}

export const onRequest = async ({ request, env }) => {
  try {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 })
    }

    const { email, password } = await request.json()
    const supabase = getSupabaseClient(env)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 401 })
    }

    return new Response(JSON.stringify({ success: true, user: data.user }), { status: 200 })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}
