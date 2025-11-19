const { supabase } = require('./_supabaseClient')

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      }
    }

    const { email, password } = JSON.parse(event.body)

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single()

    if (error || !data) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid credentials' })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, user: data })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
