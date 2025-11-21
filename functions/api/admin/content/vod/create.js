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
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const { title, video_url, description, category_id, display_order, is_recommended, thumbnail_url } =
      await request.json()

    if (!title || !video_url) {
      return jsonResponse({ error: 'title and video_url are required' }, 400)
    }

    const supabase = getSupabaseClient(env)

    const { data, error } = await supabase
      .from('classroom_content')
      .insert({
        type: 'vod',
        title,
        video_url,
        description: description ?? null,
        vod_category: category_id ?? null,
        display_order: display_order ?? null,
        is_recommended: is_recommended ?? false,
        thumbnail_url: thumbnail_url ?? null,
        created_at: new Date().toISOString()
      })
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
