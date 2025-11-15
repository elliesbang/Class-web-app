import {
  initNotion,
  queryDB,
  jsonResponse,
  errorResponse,
} from './utils/notion.js';

const STUDENT_KEYS = ['Students', 'students', '수강생', '학생', 'Student', 'studentEmails'];
const STATUS_KEYS = ['Status', 'status', '진행상태'];
const NAME_KEYS = ['Name', 'name', '클래스명', '강의명'];

function toArray(value) {
  if (!value && value !== 0) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [value];
}

function findProperty(properties, keys) {
  for (const key of keys) {
    if (key in properties) {
      return properties[key];
    }
  }

  return null;
}

function isOngoing(properties) {
  const status = (findProperty(properties, STATUS_KEYS) || '').toString().toLowerCase();
  if (!status) {
    return true;
  }

  return ['ongoing', 'in progress', '진행중', '진행 중', 'active'].some((keyword) =>
    status.includes(keyword),
  );
}

export const onRequest = async ({ request, env }) => {
  if (request.method !== 'GET') {
    return new Response(null, { status: 405 });
  }

  if (!env.DB_CLASSROOM_LIST) {
    return errorResponse(500, '강의실 데이터베이스가 설정되지 않았습니다.');
  }

  try {
    initNotion(env);
    const url = new URL(request.url);
    const studentFilter = url.searchParams.get('student');
    const statusFilter = url.searchParams.get('status');
    const onlyOngoing = url.searchParams.get('ongoing') === 'true';

    const { results } = await queryDB(env.DB_CLASSROOM_LIST, {}, env);

    const filtered = results.filter((page) => {
      const properties = page.properties ?? {};
      let match = true;

      if (studentFilter) {
        const studentList = toArray(findProperty(properties, STUDENT_KEYS));
        const normalised = studentList.map((item) => item?.toString().toLowerCase());
        match = normalised.includes(studentFilter.toLowerCase());
      }

      if (match && statusFilter) {
        const status = (findProperty(properties, STATUS_KEYS) || '').toString().toLowerCase();
        match = status.includes(statusFilter.toLowerCase());
      }

      if (match && onlyOngoing) {
        match = isOngoing(properties);
      }

      return match;
    });

    return jsonResponse({
      success: true,
      total: filtered.length,
      items: filtered.map((page) => ({
        id: page.id,
        name: findProperty(page.properties ?? {}, NAME_KEYS) ?? null,
        status: findProperty(page.properties ?? {}, STATUS_KEYS),
        createdTime: page.createdTime,
        lastEditedTime: page.lastEditedTime,
        properties: page.properties,
      })),
    });
  } catch (error) {
    console.error('[classroom] failed to load', error);
    return errorResponse(500, '강의실 정보를 불러오는 중 오류가 발생했습니다.');
  }
};
