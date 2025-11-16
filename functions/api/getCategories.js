import { getSheetValues, appendSheetValues } from '../utils/googleSheet.js';

const normaliseString = (value) => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value == null) {
    return '';
  }
  return String(value).trim();
};

export async function onRequest(context) {
  try {
    const rows = await getSheetValues(context?.env, '클래스룸 카테고리');
    const categories = [...new Set(rows.map((row) => normaliseString(row.category || row.Category)).filter(Boolean))];
    return Response.json(categories);
  } catch (error) {
    console.error('[getCategories] failed to load sheet data', error);
    return new Response(JSON.stringify({ error: 'Failed to load category list' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
