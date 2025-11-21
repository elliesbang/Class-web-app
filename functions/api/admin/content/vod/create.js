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

    const { title, video_url, description, category_id } = await request.json()

    if (!title || !video_url) {
      return jsonResponse({ error: 'title and video_url are required' }, 400)
    }

    const supabase = getSupabaseClient(env)

    const { data, error } = await supabase
      .from('vod_videos')
      .insert({
        title,
        video_url,
        description: description ?? null,
        category_id: category_id ?? null,
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
