import {
  initNotion,
  queryDB,
  createPage,
  jsonResponse,
  errorResponse,
  buildTitle,
  buildRichText,
  buildRelation,
  cleanProperties,
} from './utils/notion.js';

const ASSIGNMENT_RELATION_KEYS = ['Assignment', 'assignment', '과제'];
const FEEDBACK_KEYS = ['Feedback', 'feedback', '내용'];
const ADMIN_KEYS = ['Admin', 'admin', '작성자', '담당자'];
const STUDENT_KEYS = ['Student', 'student', '학생'];

function findProperty(properties, keys) {
  for (const key of keys) {
    if (key in properties) {
      return properties[key];
    }
  }

  return null;
}

function extractRelationIds(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'string' ? item : item?.id)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return [value];
  }

  if (typeof value === 'object' && value.id) {
    return [value.id];
  }

  return [];
}

export const onRequest = async ({ request, env }) => {
  if (!env.DB_FEEDBACK) {
    return errorResponse(500, '피드백 데이터베이스가 설정되지 않았습니다.');
  }

  try {
    initNotion(env);

    if (request.method === 'GET') {
      const url = new URL(request.url);
      const assignmentId = url.searchParams.get('assignmentId');
      const student = url.searchParams.get('student');

      const { results } = await queryDB(env.DB_FEEDBACK, {}, env);

      const filtered = results.filter((page) => {
        const properties = page.properties ?? {};
        let matches = true;

        if (assignmentId) {
          const relationIds = extractRelationIds(findProperty(properties, ASSIGNMENT_RELATION_KEYS));
          matches = relationIds.includes(assignmentId);
        }

        if (matches && student) {
          const studentValue = findProperty(properties, STUDENT_KEYS) || '';
          matches = studentValue.toString().toLowerCase().includes(student.toLowerCase());
        }

        return matches;
      });

      return jsonResponse({
        success: true,
        total: filtered.length,
        items: filtered.map((page) => ({
          id: page.id,
          assignment: findProperty(page.properties ?? {}, ASSIGNMENT_RELATION_KEYS),
          feedback: findProperty(page.properties ?? {}, FEEDBACK_KEYS),
          admin: findProperty(page.properties ?? {}, ADMIN_KEYS),
          student: findProperty(page.properties ?? {}, STUDENT_KEYS),
          createdTime: page.createdTime,
          lastEditedTime: page.lastEditedTime,
          properties: page.properties,
        })),
      });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const { assignmentId, feedback, adminName, student } = body ?? {};

      if (!assignmentId || !feedback || !adminName) {
        return errorResponse(400, '필수 항목이 누락되었습니다.');
      }

      const properties = cleanProperties({
        Name: buildTitle(`${adminName} 피드백`),
        Feedback: buildRichText(feedback),
        Admin: buildRichText(adminName),
        Student: student ? buildRichText(student) : undefined,
        Assignment: buildRelation(assignmentId),
      });

      const page = await createPage(env.DB_FEEDBACK, properties, env);
      return jsonResponse({ success: true, feedback: page });
    }

    return new Response(null, { status: 405 });
  } catch (error) {
    console.error('[feedback] failed', error);
    return errorResponse(500, '피드백 처리 중 오류가 발생했습니다.');
  }
};
