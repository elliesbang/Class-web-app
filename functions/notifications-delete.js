const { supabase } = require('./_supabaseClient')

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      }
    }

    const { id } = JSON.parse(event.body || '{}')

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Notification id is required.' })
      }
    }

    const { error } = await supabase.from('notifications').delete().eq('id', id)

    if (error) {
      throw error
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
