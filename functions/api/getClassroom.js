import { getSheetValues, appendSheetValues } from '../utils/googleSheet.js';

const normaliseString = (value, fallback = '') => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (value == null) {
    return fallback;
  }
  const stringified = String(value).trim();
  return stringified.length > 0 ? stringified : fallback;
};

export async function onRequest(context) {
  try {
    const rows = await getSheetValues(context?.env, '클래스룸 카테고리');

    const grouped = {};
    rows.forEach((row) => {
      const categoryName = normaliseString(row.category || row.Category);
      const subCategoryName = normaliseString(row.subCategory || row.SubCategory);
      if (!categoryName || !subCategoryName) {
        return;
      }

      if (!grouped[categoryName]) {
        grouped[categoryName] = {};
      }
      if (!grouped[categoryName][subCategoryName]) {
        grouped[categoryName][subCategoryName] = [];
      }

      grouped[categoryName][subCategoryName].push({
        title:
          normaliseString(row['title(강좌명)']) ||
          normaliseString(row.title) ||
          normaliseString(row.name) ||
          '',
        description: normaliseString(row.description || row.overview || ''),
        videoUrl: normaliseString(row.videoUrl || row.url || ''),
        resourceUrl: normaliseString(row.resourceUrl || row.attachment || ''),
      });
    });

    return Response.json(grouped);
  } catch (error) {
    console.error('[getClassroom] failed to load sheet data', error);
    return new Response(JSON.stringify({ error: 'Failed to load classroom categories' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
