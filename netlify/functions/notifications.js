import { supabase } from './_supabaseClient.js';

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { message: 'Method not allowed' });
  }

  const userId = event.headers['x-user-id'];
  if (!userId) {
    return jsonResponse(400, { message: 'X-User-Id header is required.' });
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return jsonResponse(500, { message: 'Failed to fetch notifications', error: error.message });
  }

  return jsonResponse(200, { data: data ?? [] });
};
