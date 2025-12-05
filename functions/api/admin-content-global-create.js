import { createClient } from '@supabase/supabase-js'

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })

const getSupabaseClient = (env) => {
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ??
    env.VITE_SUPABASE_SERVICE_ROLE_KEY ??
    env.SUPABASE_KEY ??
    env.SUPABASE_ANON_KEY ??
    env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) throw new Error('Missing Supabase credentials')

  return createClient(url, key, { auth: { persistSession: false }, global: { fetch } })
}

export const onRequestPost = async ({ request, env }) => {
  try {
    const { title, content, is_visible } = await request.json()

    if (!title || !content) {
      return jsonResponse({ error: 'title and content are required' }, 400)
    }

    const supabase = getSupabaseClient(env)

    const { data, error } = await supabase
      .from('classroom_contents')
      .insert({
        type: 'global_notice',
        title,
        content,
        is_visible: typeof is_visible === 'boolean' ? is_visible : true
      })
      .select()
      .single()

    if (error) throw error

    return jsonResponse(data)
  } catch (error) {
    console.error('[global/create] ERROR:', error)
    return jsonResponse({ error: error.message ?? 'Internal Error' }, 500)
  }
}

export const onRequest = async () => jsonResponse({ error: 'Method not allowed' }, 405)
