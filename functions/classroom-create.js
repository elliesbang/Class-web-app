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

export const onRequest = async ({ request, env }) => {
  try {
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method Not Allowed' }, 405)
    }

    const body = await request.json()

    const normalizeInt = (v) => {
      if (v === '' || v === null || v === undefined) return null
      const n = Number(v)
      return Number.isNaN(n) ? null : n
    }

    const normalizeDate = (v) => {
      if (!v || v === '') return null
      return v
    }

    const normalizeArray = (v) => {
      if (!v || v === '') return []
      if (Array.isArray(v)) return v
      return [v]
    }

    const supabase = getSupabaseClient(env)

    const { data, error } = await supabase
      .from('classes')
      .insert([
        {
          name: body.name ?? '',
          code: body.code ?? '',
          category: body.category ?? '',
          category_id: normalizeInt(body.category_id),
          start_date: normalizeDate(body.startDate),
          end_date: normalizeDate(body.endDate),
          assignment_upload_time:
            body.assignmentUploadTime === '' ? null : body.assignmentUploadTime ?? 'all_day',
          assignment_upload_days: normalizeArray(body.assignmentUploadDays),
          delivery_methods: normalizeArray(body.deliveryMethods),
          is_active: body.isActive === undefined ? true : Boolean(body.isActive)
        }
      ])
      .select()

    if (error) {
      return jsonResponse({ error: error.message }, 500)
    }

    return jsonResponse({ ok: true, data })
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
}
