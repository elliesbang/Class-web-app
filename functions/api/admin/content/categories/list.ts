import { createClient } from '@supabase/supabase-js'

export async function onRequest({ env }) {
  try {
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500 }
      )
    }

    return new Response(JSON.stringify({ data }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    )
  }
}