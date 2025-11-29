import { createClient } from '@supabase/supabase-js'

const getSupabaseClient = (env) => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
}

export const onRequest = async ({ request, env }) => {
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = getSupabaseClient(env)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 401 })
    }

    const { user, session } = data

    let profile = null

    if (user?.id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      profile = profileData ?? null
    }

    return new Response(
      JSON.stringify({
        user,
        session,
        profile,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message ?? 'Server error' }), { status: 500 })
  }
}
