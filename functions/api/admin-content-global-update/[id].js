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

const handleUpdate = async ({ request, env, params }) => {
  const id = parseId(params?.id)
  if (id === null) return jsonResponse({ error: 'Valid id is required' }, 400)

  const { title, content, is_visible } = await request.json()
  if (!title || !content) {
    return jsonResponse({ error: 'title and content are required' }, 400)
  }

  const supabase = getSupabaseClient(env)
  const { data, error } = await supabase
    .from('classroom_contents')
    .update({
      title,
      content,
      is_visible: typeof is_visible === 'boolean' ? is_visible : true
    })
    .eq('id', id)
    .eq('type', 'global_notice')
    .select()
    .single()

  if (error) throw error

  return jsonResponse(data)
}

export const onRequestPut = async (ctx) => {
  try {
    return await handleUpdate(ctx)
  } catch (error) {
    console.error('[global/update] ERROR:', error)
    return jsonResponse({ error: error.message ?? 'Internal Error' }, 500)
  }
}

export const onRequestPatch = onRequestPut
export const onRequest = async () => jsonResponse({ error: 'Method not allowed' }, 405)
