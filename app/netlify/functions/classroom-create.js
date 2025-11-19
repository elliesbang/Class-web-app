import { createClient } from '@supabase/supabase-js';

export async function handler(event, context) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    const body = JSON.parse(event.body || '{}');

    const toInt = (v) => {
      if (v === '' || v === undefined || v === null) return null;
      const n = parseInt(v, 10);
      return isNaN(n) ? null : n;
    };

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('classes')
      .insert([
        {
          name: body.name,
          code: body.code,
          category: body.category,
          category_id: toInt(body.category_id),
          start_date: toInt(body.start_date),
          end_date: toInt(body.end_date),
          duration: toInt(body.duration),
          assignment_upload_time: toInt(body.assignment_upload_time),
          assignment_upload_days: toInt(body.assignment_upload_days),
          delivery_methods: body.delivery_methods || '',
          is_active: toInt(body.is_active),
        },
      ])
      .select();

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, data }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
