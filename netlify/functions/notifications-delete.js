import { supabase } from './_supabaseClient.js';

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { message: 'Method not allowed' });
  }

  const userId = event.headers['x-user-id'];
  if (!userId) {
    return jsonResponse(400, { message: 'X-User-Id header is required.' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return jsonResponse(400, { message: 'Invalid JSON payload.' });
  }

  const id = payload?.id;
  if (!id) {
    return jsonResponse(400, { message: 'Notification id is required.' });
  }

  const { error } = await supabase.from('notifications').delete().eq('id', id).eq('user_id', userId);

  if (error) {
    return jsonResponse(500, { message: 'Failed to delete notification', error: error.message });
  }

  return jsonResponse(200, { success: true });
};
