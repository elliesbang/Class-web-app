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

const mapCategory = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description ?? row.text,
  orderNum: row.order_num ?? 0,
  isVisible: row.is_visible ?? true
})

export async function onRequestGet({ env }) {
  try {
    const supabase = getSupabaseClient(env)

    const { data, error } = await supabase
      .from('vod_category')
      .select('*')
      .order('order_num', { ascending: true })

    if (error) throw error

    const mapped = Array.isArray(data) ? data.map(mapCategory) : []

    return jsonResponse({ data: mapped })
  } catch (error) {
    console.error('[vod/categories] error', error)
    return jsonResponse({ error: error.message }, 500)
  }
}
