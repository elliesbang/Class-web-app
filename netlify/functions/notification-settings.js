import { supabase } from './_supabaseClient'

const parseBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value
  if (value === 1 || value === '1' || value === 'true') return true
  if (value === 0 || value === '0' || value === 'false') return false
  return fallback
}

export async function handler(event, context) {
  try {
    const userId = event.headers['x-user-id'] || event.headers['X-User-Id']

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'X-User-Id header is required.' })
      }
    }

    if (event.httpMethod === 'GET') {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('user_id, notify_assignment, notify_feedback, notify_global_notice')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        throw error
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ data: data || null })
      }
    }

    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}')
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

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, data })
      }
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
