import { getSheetValues, appendSheetValues } from '../utils/googleSheet.js';

export async function onRequest(context) {
  try {
    const rows = await getSheetValues(context?.env, '콘텐츠');
    return Response.json(rows);
  } catch (error) {
    console.error('[getContent] failed to load sheet data', error);
    return new Response(JSON.stringify({ error: 'Failed to load content list' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
