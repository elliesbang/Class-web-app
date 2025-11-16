import { getSheet } from '../utils/googleSheet';

export async function onRequest(context) {
  try {
    const rows = await getSheet('VOD 카테고리', context?.env);
    return Response.json(rows);
  } catch (error) {
    console.error('[getVOD] failed to load sheet data', error);
    return new Response(JSON.stringify({ error: 'Failed to load VOD list' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
