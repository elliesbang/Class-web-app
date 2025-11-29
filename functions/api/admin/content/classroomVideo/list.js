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
    if (request.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const supabase = getSupabaseClient(env)

    const { searchParams } = new URL(request.url)
    const classroomId = searchParams.get('classroom_id')

    if (!classroomId) {
      return jsonResponse({ error: 'classroom_id is required' }, 400)
    }

    const { data, error } = await supabase
      .from('class_contents')
      .select('*')
      .eq('class_id', classroomId)
      .eq('type', 'video')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return jsonResponse(data ?? [])
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
}