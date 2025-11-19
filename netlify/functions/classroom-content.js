import { supabase } from './_supabaseClient'

export async function handler(event, context) {
  try {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      }
    }

    const { class_id: classId, tab } = event.queryStringParameters || {}

    if (!classId || !tab) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing class_id or tab' })
      }
    }

    const { data, error } = await supabase
      .from('classroom_content')
      .select('id, class_id, type, title, content, url, created_at')
      .eq('class_id', classId)
      .eq('type', tab)

    if (error) {
      throw error
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data || [])
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
