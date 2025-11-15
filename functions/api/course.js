import {
  initNotion,
  queryDB,
  jsonResponse,
  errorResponse,
} from './utils/notion.js';

const CLASS_KEYS = ['Class', 'classId', 'ClassId', 'Classroom', '강의', '수업'];
const WEEK_KEYS = ['Week', 'week', '주차'];
const TITLE_KEYS = ['Name', 'name', '제목', '주차명'];
const STATUS_KEYS = ['Status', 'status'];

function findProperty(properties, keys) {
  for (const key of keys) {
    if (key in properties) {
      return properties[key];
    }
  }

  return null;
}

export const onRequest = async ({ request, env }) => {
  if (request.method !== 'GET') {
    return new Response(null, { status: 405 });
  }

  if (!env.DB_COURSE) {
    return errorResponse(500, '강의 데이터베이스가 설정되지 않았습니다.');
  }

  try {
    initNotion(env);

    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId') || url.searchParams.get('classId');
    const weekFilter = url.searchParams.get('week');
    const statusFilter = url.searchParams.get('status');

    const { results } = await queryDB(env.DB_COURSE, {}, env);

    const filtered = results.filter((page) => {
      const properties = page.properties ?? {};
      let matches = true;

      if (courseId) {
        const classValue = findProperty(properties, CLASS_KEYS);
        if (Array.isArray(classValue)) {
          matches = classValue.map((item) => item?.toString()).includes(courseId);
        } else {
          matches = classValue?.toString() === courseId;
        }
      }

      if (matches && weekFilter) {
        matches = (findProperty(properties, WEEK_KEYS) ?? '').toString() === weekFilter;
      }

      if (matches && statusFilter) {
        matches = (findProperty(properties, STATUS_KEYS) ?? '')
          .toString()
          .toLowerCase()
          .includes(statusFilter.toLowerCase());
      }

      return matches;
    });

    return jsonResponse({
      success: true,
      total: filtered.length,
      items: filtered.map((page) => ({
        id: page.id,
        title: findProperty(page.properties ?? {}, TITLE_KEYS),
        classId: findProperty(page.properties ?? {}, CLASS_KEYS),
        week: findProperty(page.properties ?? {}, WEEK_KEYS),
        status: findProperty(page.properties ?? {}, STATUS_KEYS),
        createdTime: page.createdTime,
        lastEditedTime: page.lastEditedTime,
        properties: page.properties,
      })),
    });
  } catch (error) {
    console.error('[course] failed to load', error);
    return errorResponse(500, '강의 주차 정보를 불러오는 중 오류가 발생했습니다.');
  }
};
