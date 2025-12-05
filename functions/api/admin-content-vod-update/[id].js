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
    env.SUPABASE_KEY ??
    env.SUPABASE_ANON_KEY ??
    env.VITE_SUPABASE_SERVICE_ROLE_KEY ??
    env.VITE_SUPABASE_ANON_KEY

  return createClient(url, key, { auth: { persistSession: false }, global: { fetch } })
}

const extractId = (request, params) => {
  if (params?.id) return params.id
  const { pathname } = new URL(request.url)
  const segments = pathname.split('/').filter(Boolean)
  return segments.pop()
}

export async function onRequestPut(context) {
  return handleUpdate(context)
}

export async function onRequestPatch(context) {
  return handleUpdate(context)
}

async function handleUpdate({ request, env, params }) {
  try {
    if (request.method !== 'PUT' && request.method !== 'PATCH') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const id = extractId(request, params)

    if (!id) {
      return jsonResponse({ error: 'ID is required' }, 400)
    }

    const body = await request.json()
    const {
      title,
      url,
      description,
      category_id,
      order_index,
      is_recommended,
      thumbnail_url,
      is_visible
    } = body ?? {}

    if (!title || !url) {
      return jsonResponse({ error: 'title and url are required' }, 400)
    }

    const updates = {
      title,
      url,
      description: description ?? null,
      is_recommended: typeof is_recommended === 'boolean' ? is_recommended : undefined,
      thumbnail_url: thumbnail_url ?? undefined,
      is_visible: typeof is_visible === 'boolean' ? is_visible : undefined
    }

    if (typeof category_id !== 'undefined') {
      updates.category_id = Number(category_id)
    }

    if (typeof order_index !== 'undefined') {
      const parsedOrder = typeof order_index === 'number' ? order_index : Number(order_index)
      updates.order_index = Number.isNaN(parsedOrder) ? 0 : parsedOrder
    }

    const supabase = getSupabaseClient(env)

    const { data, error } = await supabase
      .from('vod_videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return jsonResponse({ data })
  } catch (error) {
    console.error('[vod_videos/update] error', error)
    return jsonResponse({ error: error.message }, 500)
  }
}
