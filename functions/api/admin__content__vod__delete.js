import { createClient } from '@supabase/supabase-js'

const getSupabaseClient = (env) => {
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ??
    env.SUPABASE_KEY ??
    env.SUPABASE_ANON_KEY ??
    env.VITE_SUPABASE_SERVICE_ROLE_KEY ??
    env.VITE_SUPABASE_ANON_KEY

  return createClient(url, key)
}

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })

export async function onRequest({ request, env }) {
  try {
    if (request.method !== 'DELETE') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const { pathname } = new URL(request.url)
    const segments = pathname.split('/').filter(Boolean)
    const id = segments.pop()

    if (!id) {
      return jsonResponse({ error: 'ID is required' }, 400)
    }

    const supabase = getSupabaseClient(env)

    const { error } = await supabase
      .from('classroom_content')
      .delete()
      .eq('id', id)
      .eq('type', 'vod')

    if (error) {
      throw error
    }

    return jsonResponse({ success: true })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
}
