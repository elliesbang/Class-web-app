import { getSheet } from '@/utils/googleSheet';

export async function onRequest(context) {
  try {
    const rows = await getSheet('콘텐츠', context?.env);
    return Response.json(rows);
  } catch (error) {
    console.error('[getContent] failed to load sheet data', error);
    return new Response(JSON.stringify({ error: 'Failed to load content list' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
