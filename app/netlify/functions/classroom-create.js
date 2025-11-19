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

    // 날짜는 null 또는 그대로 문자열로 전달
    const normalizeDate = (v) => {
      if (!v || v === '') return null;
      return v; // '2025-01-20' 같은 문자열 그대로 저장
    };

    const normalizeArray = (v) => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      return [v];
    };

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('classes')
      .insert([
        {
          name: body.name ?? '',
          code: body.code ?? '',
          category: body.category ?? '',
          category_id: body.category_id ? Number(body.category_id) : null,

          // 🔥 날짜는 문자열 또는 null
          start_date: normalizeDate(body.startDate),
          end_date: normalizeDate(body.endDate),

          // 🔥 업로드 시간은 문자열 그대로
          assignment_upload_time: body.assignmentUploadTime ?? 'all_day',

          // 🔥 배열로 저장
          assignment_upload_days: normalizeArray(body.assignmentUploadDays),

          // 🔥 배열로 저장
          delivery_methods: normalizeArray(body.deliveryMethods),

          // 🔥 boolean 그대로 저장
          is_active: body.isActive === undefined ? true : Boolean(body.isActive),
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
