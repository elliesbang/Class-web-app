import { createClient } from '@supabase/supabase-js'

const getSupabaseClient = (env) => {
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ??
    env.SUPABASE_KEY ??
    env.SUPABASE_ANON_KEY ??
    env.VITE_SUPABASE_SERVICE_ROLE_KEY ??
    env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(url, key)
}

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })

const parseBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value
  if (value === 1 || value === '1' || value === 'true') return true
  if (value === 0 || value === '0' || value === 'false') return false
  return fallback
}

export const onRequest = async ({ request, env }) => {
  try {
    const userId = request.headers.get('x-user-id') || request.headers.get('X-User-Id')

    if (!userId) {
      return jsonResponse({ error: 'X-User-Id header is required.' }, 400)
    }

    const supabase = getSupabaseClient(env)

    if (request.method === 'GET') {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('user_id, notify_assignment, notify_feedback, notify_global_notice')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        throw error
      }

      return jsonResponse({ data: data || null })
    }

    if (request.method === 'POST') {
      const payload = await request
        .json()
        .catch(() => ({}))
      const preferences = payload.preferences ?? payload

      const settings = {
        user_id: userId,
        notify_assignment: parseBoolean(preferences?.notify_assignment),
        notify_feedback: parseBoolean(preferences?.notify_feedback),
        notify_global_notice: parseBoolean(preferences?.notify_global_notice)
      }

      const { data, error } = await supabase
        .from('notification_settings')
        .upsert(settings, { onConflict: 'user_id' })
        .select('user_id, notify_assignment, notify_feedback, notify_global_notice')
        .maybeSingle()

      if (error) {
        throw error
      }

      return jsonResponse({ success: true, data })
    }

    return jsonResponse({ error: 'Method not allowed' }, 405)
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
}
