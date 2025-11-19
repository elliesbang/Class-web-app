import { supabase } from './_supabaseClient.js';

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

const parseBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return fallback;
};

export const handler = async (event) => {
  const userId = event.headers['x-user-id'];
  if (!userId) {
    return jsonResponse(400, { message: 'X-User-Id header is required.' });
  }

  if (event.httpMethod === 'GET') {
    const { data, error } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return jsonResponse(500, { message: 'Failed to fetch notification settings', error: error.message });
    }

    return jsonResponse(200, { data: data ?? null });
  }

  if (event.httpMethod === 'POST') {
    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (error) {
      return jsonResponse(400, { message: 'Invalid JSON payload.' });
    }

    const settings = {
      user_id: userId,
      notify_assignment: parseBoolean(payload?.notify_assignment),
      notify_feedback: parseBoolean(payload?.notify_feedback),
      notify_global_notice: parseBoolean(payload?.notify_global_notice),
    };

    const { data, error } = await supabase
      .from('user_notification_settings')
      .upsert(settings, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (error) {
      return jsonResponse(500, { message: 'Failed to save notification settings', error: error.message });
    }

    return jsonResponse(200, { success: true, data });
  }

  return jsonResponse(405, { message: 'Method not allowed' });
};
