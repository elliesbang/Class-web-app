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

    const { classroom_id, title, video_url, description, display_order } = await request.json()

    if (!title || !video_url) {
      return jsonResponse({ error: 'title and video_url are required' }, 400)
    }

    const updates = { title, url: video_url }

    if (typeof classroom_id !== 'undefined') {
      updates.class_id = classroom_id
    }

    if (typeof description !== 'undefined') {
      updates.description = description
    }

    if (typeof display_order !== 'undefined') {
      updates.display_order = display_order
    }

    const supabase = getSupabaseClient(env)

    const { data, error } = await supabase
      .from('classroom_content')
      .update(updates)
      .eq('id', id)
      .eq('type', 'video')
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
