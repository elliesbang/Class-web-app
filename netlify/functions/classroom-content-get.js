import { supabase } from './_supabaseClient.js'

export async function handler(event) {
  try {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      }
    }

    const { type, category_id: categoryId } = event.queryStringParameters || {}

    if (!type) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'type이 필요합니다.' }),
      }
    }

    const query = supabase
      .from('classroom_content')
      .select('id, type, category_id, title, content, url, created_at')
      .eq('type', type)
      .order('created_at', { ascending: false })

    if (categoryId) {
      query.eq('category_id', categoryId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data || []),
    }
  } catch (error) {
    console.error('[classroom-content-get] unexpected error', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    }
  }
}
