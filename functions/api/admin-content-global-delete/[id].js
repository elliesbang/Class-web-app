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

const parseId = (rawId) => {
  if (rawId === undefined || rawId === null || rawId === '') return null
  const num = Number.parseInt(String(rawId), 10)
  return Number.isNaN(num) ? null : num
}

export const onRequestDelete = async ({ env, params }) => {
  try {
    const id = parseId(params?.id)
    if (id === null) return jsonResponse({ error: 'Valid id is required' }, 400)

    const supabase = getSupabaseClient(env)
    const { error } = await supabase
      .from('classroom_contents')
      .delete()
      .eq('id', id)
      .eq('type', 'global_notice')

    if (error) throw error

    return jsonResponse({ success: true })
  } catch (error) {
    console.error('[global/delete] ERROR:', error)
    return jsonResponse({ error: error.message ?? 'Internal Error' }, 500)
  }
}

export const onRequest = async () => jsonResponse({ error: 'Method not allowed' }, 405)
