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

export async function onRequestPost({ request, env }) {
  try {
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
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

    if (!title || !url || typeof category_id === 'undefined' || category_id === null) {
      return jsonResponse({ error: 'title, url and category_id are required' }, 400)
    }

    const payload = {
      title,
      url,
      description: description ?? null,
      category_id: Number(category_id),
      order_index: typeof order_index === 'number' ? order_index : Number(order_index) || 0,
      is_recommended: Boolean(is_recommended),
      thumbnail_url: thumbnail_url ?? null,
      is_visible: typeof is_visible === 'boolean' ? is_visible : true
    }

    const supabase = getSupabaseClient(env)

    const { data, error } = await supabase
      .from('vod_videos')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('[vod_videos/save] DB Error:', error)
      return jsonResponse({ error: 'DB insert failed', detail: error.message }, 500)
    }

    return jsonResponse({ data }, 201)
  } catch (error) {
    console.error('[vod_videos/save] Internal Error:', error)
    return jsonResponse({ error: 'Internal Error' }, 500)
  }
}
