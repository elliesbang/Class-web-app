import {
  initNotion,
  queryDB,
  createPage,
  jsonResponse,
  errorResponse,
  buildTitle,
  buildRichText,
  cleanProperties,
} from './utils/notion.js';

const STATUS_KEYS = ['Status', 'status', '상태'];
const CLASS_STATUS_KEYS = ['Status', 'status', '진행상태'];
const CLASS_NAME_KEYS = ['Name', 'name', '클래스명', '강의명'];
const ACTIVITY_TITLE_KEYS = ['Title', 'title', 'Name', 'name', '활동'];
const ACTIVITY_DETAIL_KEYS = ['Detail', 'detail', '내용', 'Description'];
const ADMIN_KEYS = ['Admin', 'admin', '담당자'];

function findProperty(properties, keys) {
  for (const key of keys) {
    if (key in properties) {
      return properties[key];
    }
  }

  return null;
}

function toLower(value) {
  return value ? value.toString().toLowerCase() : '';
}

function isCompletedStatus(status) {
  const normalised = toLower(status);
  if (!normalised) {
    return false;
  }

  return [
    'done',
    '완료',
    'submitted',
    'complete',
    'feedback 완료',
    '완료됨',
    'graded',
  ].some((keyword) => normalised.includes(keyword));
}

function isOngoingClassStatus(status) {
  const normalised = toLower(status);
  if (!normalised) {
    return true;
  }

  return ['ongoing', 'in progress', '진행중', '진행 중', 'active', '운영'].some((keyword) =>
    normalised.includes(keyword),
  );
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getWeekStart(date) {
  const copied = new Date(date);
  const day = copied.getDay();
  const diff = copied.getDate() - day;
  copied.setDate(diff);
  copied.setHours(0, 0, 0, 0);
  return copied;
}

function getWeekEnd(date) {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return end;
}

function sortByCreatedTimeDescending(a, b) {
  const aTime = parseDate(a.createdTime)?.getTime() ?? 0;
  const bTime = parseDate(b.createdTime)?.getTime() ?? 0;
  return bTime - aTime;
}

export const onRequest = async ({ request, env }) => {
  if (request.method === 'POST') {
    if (!env.DB_ACTIVITY_LOG) {
      return errorResponse(500, '활동 로그 데이터베이스가 설정되지 않았습니다.');
    }

    try {
      initNotion(env);
      const body = await request.json();
      const { action, actor, detail, link } = body ?? {};

      if (!action || !actor) {
        return errorResponse(400, '액션과 담당자는 필수입니다.');
      }

      const properties = cleanProperties({
        Name: buildTitle(action),
        Action: buildRichText(action),
        Actor: buildRichText(actor),
        Detail: buildRichText(detail),
        Link: link ? { url: link } : undefined,
      });

      const page = await createPage(env.DB_ACTIVITY_LOG, properties, env);
      return jsonResponse({ success: true, activity: page }, 201);
    } catch (error) {
      console.error('[admin] log create failed', error);
      return errorResponse(500, '활동 로그를 기록하는 중 오류가 발생했습니다.');
    }
  }

  if (request.method !== 'GET') {
    return new Response(null, { status: 405 });
  }

  if (!env.DB_ASSIGNMENT || !env.DB_FEEDBACK || !env.DB_CLASSROOM_LIST) {
    return errorResponse(500, '관리자 대시보드 구성을 위한 데이터베이스가 부족합니다.');
  }

  try {
    initNotion(env);

    const [assignmentResult, feedbackResult, classroomResult, activityResult] = await Promise.all([
      queryDB(env.DB_ASSIGNMENT, {}, env),
      queryDB(env.DB_FEEDBACK, {}, env),
      queryDB(env.DB_CLASSROOM_LIST, {}, env),
      env.DB_ACTIVITY_LOG ? queryDB(env.DB_ACTIVITY_LOG, {}, env) : Promise.resolve({ results: [] }),
    ]);

    const assignments = assignmentResult.results;
    const feedbacks = feedbackResult.results;
    const classrooms = classroomResult.results;
    const activities = activityResult.results ?? [];

    const feedbackAssignmentIds = new Set();
    feedbacks.forEach((item) => {
      const relation = item.properties?.Assignment;
      if (Array.isArray(relation)) {
        relation.forEach((id) => feedbackAssignmentIds.add(typeof id === 'string' ? id : id?.id));
      }
    });

    const pendingAssignments = assignments.filter((assignment) => {
      if (feedbackAssignmentIds.has(assignment.id)) {
        return false;
      }

      const statusValue = findProperty(assignment.properties ?? {}, STATUS_KEYS);
      return !isCompletedStatus(statusValue);
    });

    const now = new Date();
    const weekStart = getWeekStart(now);
    const weekEnd = getWeekEnd(now);

    const weeklyFeedbacks = feedbacks.filter((item) => {
      const created = parseDate(item.createdTime);
      if (!created) {
        return false;
      }

      return created >= weekStart && created < weekEnd;
    });

    const ongoingClasses = classrooms.filter((classroom) =>
      isOngoingClassStatus(findProperty(classroom.properties ?? {}, CLASS_STATUS_KEYS)),
    );

    const recentActivities = [...activities]
      .sort(sortByCreatedTimeDescending)
      .slice(0, 10)
      .map((activity) => ({
        id: activity.id,
        title: findProperty(activity.properties ?? {}, ACTIVITY_TITLE_KEYS) || '활동',
        detail: findProperty(activity.properties ?? {}, ACTIVITY_DETAIL_KEYS),
        actor: findProperty(activity.properties ?? {}, ADMIN_KEYS),
        createdTime: activity.createdTime,
        lastEditedTime: activity.lastEditedTime,
        properties: activity.properties,
      }));

    return jsonResponse({
      success: true,
      generatedAt: now.toISOString(),
      metrics: {
        totalFeedback: feedbacks.length,
        pendingFeedback: pendingAssignments.length,
        weeklyFeedback: weeklyFeedbacks.length,
        ongoingClassCount: ongoingClasses.length,
      },
      assignments,
      feedbacks,
      ongoingClasses: ongoingClasses.map((item) => ({
        id: item.id,
        name: findProperty(item.properties ?? {}, CLASS_NAME_KEYS),
        status: findProperty(item.properties ?? {}, CLASS_STATUS_KEYS),
        createdTime: item.createdTime,
        lastEditedTime: item.lastEditedTime,
        properties: item.properties,
      })),
      recentActivities,
    });
  } catch (error) {
    console.error('[admin] failed to load dashboard', error);
    return errorResponse(500, '관리자 대시보드 데이터를 불러오는 중 오류가 발생했습니다.');
  }
};
