const { createClient } = require('./_supabaseClient');

export async function onRequest(context) {
  try {
    if (context.request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await context.request.json();

    // --- 🔥 공통 Normalizer ---
    const normalizeInt = (v) => {
      if (v === '' || v === null || v === undefined) return null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    };

    const normalizeDate = (v) => {
      if (!v || v === '') return null;
      return v;
    };

    const normalizeArray = (v) => {
      if (!v || v === '') return [];
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

          // 🔥 Integer는 무조건 normalizeInt로
          category_id: normalizeInt(body.category_id),

          // 🔥 날짜는 문자열 또는 null
          start_date: normalizeDate(body.startDate),
          end_date: normalizeDate(body.endDate),

          // 🔥 업로드 시간은 문자열 또는 null
          assignment_upload_time:
            body.assignmentUploadTime === '' ? null : body.assignmentUploadTime ?? 'all_day',

          // 🔥 배열 처리
          assignment_upload_days: normalizeArray(body.assignmentUploadDays),

          // 🔥 배열 처리
          delivery_methods: normalizeArray(body.deliveryMethods),

          // 🔥 boolean
          is_active: body.isActive === undefined ? true : Boolean(body.isActive),
        },
      ])
      .select();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
