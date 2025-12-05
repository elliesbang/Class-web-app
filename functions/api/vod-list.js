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

const mapVodRow = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  url: row.url,
  categoryId: row.category_id,
  orderIndex: row.order_index,
  isRecommended: row.is_recommended,
  thumbnailUrl: row.thumbnail_url,
  createdAt: row.created_at,
  isVisible: row.is_visible
})

export async function onRequestGet({ request, env }) {
  try {
    const supabase = getSupabaseClient(env)
    const { searchParams } = new URL(request.url)

    const categoryId = searchParams.get('category_id')
    const recommended = searchParams.get('recommended')

    let query = supabase
      .from('vod_videos')
      .select('*')
      .eq('is_visible', true)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })

    if (categoryId) {
      query = query.eq('category_id', Number(categoryId))
    }

    if (recommended === 'true') {
      query = query.eq('is_recommended', true)
    }

    const { data, error } = await query

    if (error) throw error

    const mapped = Array.isArray(data) ? data.map(mapVodRow) : []

    return jsonResponse({ data: mapped })
  } catch (error) {
    console.error('[vod/list] error', error)
    return jsonResponse({ error: error.message }, 500)
  }
}
