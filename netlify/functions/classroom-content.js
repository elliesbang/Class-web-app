import { supabase } from './_supabaseClient'

export async function handler(event) {
  try {
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { id, type, category_id: categoryId, title, content, url } = body

      if (!type || !title || !content) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'type, title, content는 필수입니다.' }),
        }
      }

      const record = {
        type,
        category_id: categoryId ?? null,
        title,
        content,
        url: url ?? null,
      }

      let response
      if (id) {
        response = await supabase.from('classroom_content').update(record).eq('id', id).select().single()
      } else {
        response = await supabase.from('classroom_content').insert(record).select().single()
      }

      if (response.error) {
        throw response.error
      }

      return {
        statusCode: 200,
        body: JSON.stringify(response.data),
      }
    }

    if (event.httpMethod === 'DELETE') {
      const { id } = event.queryStringParameters || {}
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'id가 필요합니다.' }),
        }
      }

      const { error } = await supabase.from('classroom_content').delete().eq('id', id)
      if (error) {
        throw error
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      }
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  } catch (error) {
    console.error('[classroom-content] unexpected error', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    }
  }
}
