import { createClient } from '@supabase/supabase-js'

const getSupabaseClient = (env) => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    global: { fetch }
  })
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

    // ★ Query string에서 id 가져오기
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) return jsonResponse({ error: 'ID is required' }, 400)

    const { title, content, is_visible } = await request.json()
    if (!title || !content) {
      return jsonResponse({ error: 'title and content are required' }, 400)
    }

    const supabase = getSupabaseClient(env)

    // ★ 올바른 테이블 이름으로 수정
    const { data, error } = await supabase
      .from('content_global_notices') // ← 여기가 핵심
      .update({
        title,
        content,
        is_visible: is_visible ?? true
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return jsonResponse(data)
  } catch (error) {
    console.error('[global/update] ERROR:', error.message)
    return jsonResponse({ error: error.message }, 500)
  }
}
