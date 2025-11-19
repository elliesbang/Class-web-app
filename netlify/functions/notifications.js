import { supabase } from './_supabaseClient'

export async function handler(event, context) {
  try {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      }
    }

    const userId = event.headers['x-user-id'] || event.headers['X-User-Id']

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'X-User-Id header is required.' })
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ data: data || [] })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
