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
    env.VITE_SUPABASE_SERVICE_ROLE_KEY ??
    env.SUPABASE_KEY ??
    env.SUPABASE_ANON_KEY ??
    env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) throw new Error('Missing Supabase credentials')

  return createClient(url, key, { auth: { persistSession: false }, global: { fetch } })
}

export async function onRequestGet({ env }) {
  try {
    const supabase = getSupabaseClient(env)

    const { data, error } = await supabase
      .from('classroom_contents')
      .select('*')
      .eq('type', 'global_notice')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[global/list] ERROR:', error)
      return jsonResponse({ success: false, items: [], error: error.message }, 500)
    }

    return jsonResponse({ success: true, items: data ?? [] })
  } catch (error) {
    console.error('[global/list] ERROR:', error)
    return jsonResponse({ success: false, items: [], error: error.message }, 500)
  }
}
