import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_KEY ?? '');

const jsonResponse = (statusCode: number, body: any) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { message: 'Method not allowed' });
  }

  const classId = event.queryStringParameters?.class_id;
  const tab = event.queryStringParameters?.tab;

  if (!classId || !tab) {
    return { statusCode: 400, body: 'Missing class_id or tab' };
  }

  const { data, error } = await supabase
    .from('classroom_content')
    .select('id, class_id, type, title, content, url, created_at')
    .eq('class_id', classId)
    .eq('type', tab);

  if (error) {
    return jsonResponse(500, { message: 'Failed to fetch classroom content', error: error.message });
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data ?? []),
  };
};
