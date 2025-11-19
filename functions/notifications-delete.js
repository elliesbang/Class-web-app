import { createClient } from '@supabase/supabase-js'

const getSupabaseClient = (env) => {
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ??
    env.SUPABASE_KEY ??
    env.SUPABASE_ANON_KEY ??
    env.VITE_SUPABASE_SERVICE_ROLE_KEY ??
    env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(url, key)
}

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })

export const onRequest = async ({ request, env }) => {
  try {
    if (request.method !== 'POST' && request.method !== 'DELETE') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const { id } = await request.json().catch(() => ({}))

    if (!id) {
      return jsonResponse({ error: 'Notification id is required.' }, 400)
    }

    const supabase = getSupabaseClient(env)
    const { error } = await supabase.from('notifications').delete().eq('id', id)

    if (error) {
      throw error
    }

    return jsonResponse({ success: true })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
}
