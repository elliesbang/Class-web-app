import {
  initNotion,
  queryDB,
  createPage,
  jsonResponse,
  errorResponse,
  buildTitle,
  buildRichText,
  buildSelect,
  cleanProperties,
} from './utils/notion.js';

const STUDENT_KEYS = ['Student', 'student', '학생'];
const WEEK_KEYS = ['Week', 'week', '주차'];
const LINK_KEYS = ['Link', 'link', 'URL'];
const COMMENT_KEYS = ['Comment', 'comment', '메모'];
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
  if (!env.DB_ASSIGNMENT) {
    return errorResponse(500, '과제 데이터베이스가 설정되지 않았습니다.');
  }

  try {
    initNotion(env);

    if (request.method === 'GET') {
      const url = new URL(request.url);
      const student = url.searchParams.get('student');
      const week = url.searchParams.get('week');

      const { results } = await queryDB(env.DB_ASSIGNMENT, {}, env);

      const filtered = results.filter((page) => {
        const properties = page.properties ?? {};
        let matches = true;

        if (student) {
          matches = (findProperty(properties, STUDENT_KEYS) || '')
            .toString()
            .toLowerCase()
            .includes(student.toLowerCase());
        }

        if (matches && week) {
          matches = (findProperty(properties, WEEK_KEYS) || '').toString() === week;
        }

        return matches;
      });

      return jsonResponse({
        success: true,
        total: filtered.length,
        items: filtered.map((page) => ({
          id: page.id,
          student: findProperty(page.properties ?? {}, STUDENT_KEYS),
          week: findProperty(page.properties ?? {}, WEEK_KEYS),
          link: findProperty(page.properties ?? {}, LINK_KEYS),
          comment: findProperty(page.properties ?? {}, COMMENT_KEYS),
          status: findProperty(page.properties ?? {}, STATUS_KEYS),
          createdTime: page.createdTime,
          lastEditedTime: page.lastEditedTime,
          properties: page.properties,
        })),
      });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const { student, week, link, comment, status } = body ?? {};

      if (!student || !week || !link) {
        return errorResponse(400, '학생, 주차, 과제 링크는 필수입니다.');
      }

      const name = `${student} - ${week}`;
      const properties = cleanProperties({
        Name: buildTitle(name),
        Student: buildRichText(student),
        Week: buildRichText(week),
        Link: link ? { url: link } : undefined,
        Comment: buildRichText(comment),
        Status: buildSelect(status || '제출 완료'),
      });

      const page = await createPage(env.DB_ASSIGNMENT, properties, env);
      return jsonResponse({ success: true, assignment: page });
    }

    return new Response(null, { status: 405 });
  } catch (error) {
    console.error('[assignment-submit] failed', error);
    return errorResponse(500, '과제 제출 처리 중 오류가 발생했습니다.');
  }
};
