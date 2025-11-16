import { jsonResponse, errorResponse } from '../utils/jsonResponse.js';
import { readSheet } from '../utils/sheets.js';

const CONTENT_RANGE = 'Content!A1:Z1000';

const normaliseString = (value, fallback = '') => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value == null) {
    return fallback;
  }
  return String(value).trim();
};

const parseNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const lectureTypeKeywords = ['lecture', 'lectures', '강의', '강좌', '수업'];

const matchesLectureType = (value) => {
  const type = normaliseString(value).toLowerCase();
  if (!type) {
    return false;
  }
  if (lectureTypeKeywords.includes(type)) {
    return true;
  }
  return lectureTypeKeywords.some((keyword) => type.startsWith(`${keyword}-`));
};

const buildKey = (value, fallback) => {
  const base = normaliseString(value, fallback);
  if (!base) {
    return fallback;
  }
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
};

const buildLectureTree = (rows) => {
  const categories = new Map();

  rows.forEach((row) => {
    if (!matchesLectureType(row.type || row.Type)) {
      return;
    }

    const categoryIdRaw = row.categoryId || row.category_id || row.category;
    const categoryKey = buildKey(categoryIdRaw, 'lecture');
    const categoryId = normaliseString(categoryIdRaw || categoryKey || 'lecture');
    const categoryName = normaliseString(row.categoryName || row.category || categoryId || '강의실');
    const categoryOrder = parseNumber(row.categoryOrder || row.category_order, 0);
    const subCategoryIdRaw =
      row.subCategoryId || row.sub_category_id || row.courseId || row.course || row.subCategory;
    const subCategoryKey = buildKey(subCategoryIdRaw || `${categoryKey}-course`, `${categoryKey}-course`);
    const subCategoryId = normaliseString(subCategoryIdRaw || subCategoryKey || `${categoryId}-course`);
    const subCategoryName = normaliseString(
      row.subCategoryName || row.sub_category_name || row.courseName || row.course || row.subCategory || subCategoryId,
    );
    const subCategoryDescription = normaliseString(
      row.subCategoryDescription || row.sub_category_description || row.courseDescription || '',
    );
    const subCategoryOrder = parseNumber(row.subCategoryOrder || row.sub_category_order, 0);

    const lecture = {
      id: normaliseString(row.lectureId || row.id || crypto.randomUUID()),
      courseId: subCategoryId,
      categoryId,
      title: normaliseString(row.title || row.lectureTitle || '강의'),
      description: normaliseString(row.description || row.lectureDescription || ''),
      videoUrl: normaliseString(row.videoUrl || row.video_url || ''),
      resourceUrl: normaliseString(row.resourceUrl || row.resource_url || ''),
      order: parseNumber(row.order || row.lectureOrder, 0),
      raw: row,
    };

    if (!categories.has(categoryKey)) {
      categories.set(categoryKey, {
        categoryId,
        categoryName,
        categoryOrder,
        subCategories: new Map(),
      });
    }
    const category = categories.get(categoryKey);
    if (!category.subCategories.has(subCategoryKey)) {
      category.subCategories.set(subCategoryKey, {
        courseId: subCategoryId,
        courseName: subCategoryName,
        courseDescription: subCategoryDescription,
        subCategoryOrder,
        lectures: [],
      });
    }
    const subCategory = category.subCategories.get(subCategoryKey);
    subCategory.lectures.push(lecture);
  });

  const result = Array.from(categories.values())
    .map((category) => ({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      categoryOrder: category.categoryOrder,
      subCategories: Array.from(category.subCategories.values())
        .map((subCategory) => ({
          ...subCategory,
          lectures: subCategory.lectures
            .slice()
            .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'ko', { sensitivity: 'base' })),
        }))
        .sort((a, b) => a.subCategoryOrder - b.subCategoryOrder || a.courseName.localeCompare(b.courseName, 'ko', { sensitivity: 'base' })),
    }))
    .sort((a, b) => a.categoryOrder - b.categoryOrder || a.categoryName.localeCompare(b.categoryName, 'ko', { sensitivity: 'base' }));

  return result;
};

export async function onRequestGet(context) {
  try {
    const rows = await readSheet(context.env, CONTENT_RANGE);
    const data = buildLectureTree(rows);
    return jsonResponse({ success: true, data });
  } catch (error) {
    console.error('[lectures] failed to build data', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to load lectures');
  }
}
