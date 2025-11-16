import { getSheetValues, appendSheetValues } from '../utils/googleSheet.js';

export async function onRequest(context) {
  try {
    const rows = await getSheetValues(context?.env, 'VOD 카테고리');
    return Response.json(rows);
  } catch (error) {
    console.error('[getVOD] failed to load sheet data', error);
    return new Response(JSON.stringify({ error: 'Failed to load VOD list' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
