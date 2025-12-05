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
    const classroomIdParam = searchParams.get('classroom_id')
    const classroomId = classroomIdParam !== null ? Number(classroomIdParam) : null

    if (classroomId === null || Number.isNaN(classroomId)) {
      return jsonResponse({ success: false, items: [], error: 'classroom_id is required' }, 400)
    }

    const { data, error } = await supabase
      .from('classroom_materials')
      .select('*')
      .eq('class_id', classroomId)
      .order('order_num', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[classroom_materials/list] error', error)
      return jsonResponse({ success: false, items: [], error: error.message }, 500)
    }

    return jsonResponse({ success: true, items: data ?? [] })
  } catch (error) {
    console.error('[classroom_materials/list] error', error)
    return jsonResponse({ success: false, items: [], error: error.message }, 500)
  }
}
