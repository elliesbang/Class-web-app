import { getSheetValues, appendSheetValues } from '../utils/googleSheet.js';

export async function onRequest(context) {
  try {
    const rows = await getSheetValues(context?.env, '과제');
    return Response.json(rows);
  } catch (error) {
    console.error('[getAssignments] failed to load sheet data', error);
    return new Response(JSON.stringify({ error: 'Failed to load assignments' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
