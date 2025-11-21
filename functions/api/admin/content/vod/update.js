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

export const onRequest = async ({ request, env }) => {
  try {
    if (request.method !== 'PUT') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const { pathname } = new URL(request.url)
    const segments = pathname.split('/').filter(Boolean)
    const id = segments.pop()

    if (!id) {
      return jsonResponse({ error: 'ID is required' }, 400)
    }

    const { title, video_url, description, category_id } = await request.json()

    if (!title || !video_url) {
      return jsonResponse({ error: 'title and video_url are required' }, 400)
    }

    const updates = { title, video_url }

    if (typeof description !== 'undefined') {
      updates.description = description
    }

    if (typeof category_id !== 'undefined') {
      updates.category_id = category_id
    }

    const supabase = getSupabaseClient(env)

    const { data, error } = await supabase
      .from('vod_videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return jsonResponse(data)
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
}
