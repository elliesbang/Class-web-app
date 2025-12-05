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

export async function onRequest({ request, env }) {
  try {
    if (request.method !== 'PUT') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const { pathname } = new URL(request.url)
    const segments = pathname.split('/').filter(Boolean)
    const id = segments.pop()

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('class_id')

    if (!id) {
      return jsonResponse({ error: 'ID is required' }, 400)
    }

    if (!classId) {
      return jsonResponse({ error: 'class_id required' }, 400)
    }

    const { title, content, display_order } = await request.json()

    if (!title || !content) {
      return jsonResponse({ error: 'title and content are required' }, 400)
    }

    const updates = { title, content, class_id: classId }

    if (typeof display_order !== 'undefined') {
      updates.display_order = display_order
    }

    const supabase = getSupabaseClient(env)

    const { data, error } = await supabase
      .from('classroom_content')
      .update(updates)
      .eq('id', id)
      .eq('class_id', classId)
      .eq('type', 'notice')
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
