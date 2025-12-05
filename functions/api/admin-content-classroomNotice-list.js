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

  if (!url || !key) throw new Error('Missing Supabase credentials')

  return createClient(url, key, { auth: { persistSession: false }, global: { fetch } })
}

export async function onRequestGet({ request, env }) {
  try {
    const supabase = getSupabaseClient(env)

    const { searchParams } = new URL(request.url)
    const classIdParam = searchParams.get('class_id')
    const classId = classIdParam !== null ? Number(classIdParam) : null

    if (classId === null || Number.isNaN(classId)) {
      return jsonResponse({ success: false, items: [], error: 'class_id required' }, 400)
    }

    const { data, error } = await supabase
      .from('classroom_content')
      .select('*')
      .eq('class_id', classId)
      .eq('type', 'notice')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[classroom_notice/list] error', error)
      return jsonResponse({ success: false, items: [], error: error.message }, 500)
    }

    return jsonResponse({ success: true, items: data ?? [] })
  } catch (error) {
    console.error('[classroom_notice/list] error', error)
    return jsonResponse({ success: false, items: [], error: error.message }, 500)
  }
}
