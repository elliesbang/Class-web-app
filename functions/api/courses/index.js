import { ensureBaseSchema } from "../../_utils/index.js";

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const errorResponse = (error) =>
  new Response(
    JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    },
  );

const normaliseCourseId = (value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
};

const resolveCourseIdentifier = (row) => {
  const identifier = [row.category, row.name]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .find((value) => value.length > 0);

  return identifier ?? String(row.id);
};

export const onRequestPost = async (context) => {
  try {
    const { DB } = context.env;
    await ensureBaseSchema(DB);

    let payload = {};
    try {
      payload = await context.request.json();
    } catch (parseError) {
      return jsonResponse(
        { success: false, count: 0, data: [], message: '유효한 JSON 본문이 필요합니다.' },
        400,
      );
    }

    const courseIdRaw = normaliseCourseId(payload.courseId);
    const codeRaw = normaliseCourseId(payload.code);

    if (!courseIdRaw || !codeRaw) {
      return jsonResponse(
        { success: false, count: 0, data: [], message: '강의 ID와 수강 코드를 모두 입력해주세요.' },
        400,
      );
    }

    const courseIdLower = courseIdRaw.toLowerCase();
    const numericId = Number(courseIdRaw);

    let course = null;

    if (!Number.isNaN(numericId)) {
      const numericResult = await DB.prepare('SELECT id, name, code, category FROM classes WHERE id = ?1')
        .bind(numericId)
        .all();
      const numericRows = numericResult?.results ?? [];
      course = numericRows[0] ?? null;
    }

    if (!course) {
      const namedResult = await DB.prepare(
        'SELECT id, name, code, category FROM classes WHERE LOWER(name) = ?1 OR LOWER(category) = ?1',
      )
        .bind(courseIdLower)
        .all();
      const namedRows = namedResult?.results ?? [];
      course = namedRows[0] ?? null;
    }

    if (!course) {
      return jsonResponse({ success: false, count: 0, data: [], message: '등록되지 않은 강의입니다.' }, 404);
    }

    const storedCode = typeof course.code === 'string' ? course.code.trim() : '';
    if (!storedCode) {
      const rows = [
        {
          valid: false,
          courseId: resolveCourseIdentifier(course),
          message: '강의 코드가 등록되지 않았습니다.',
        },
      ];
      return jsonResponse({ success: false, count: rows.length, data: rows }, 400);
    }

    const inputCode = codeRaw.trim();
    const isValid = storedCode.localeCompare(inputCode, undefined, { sensitivity: 'accent' }) === 0;

    if (!isValid) {
      const rows = [
        {
          valid: false,
          courseId: resolveCourseIdentifier(course),
          message: '유효하지 않은 코드입니다.',
        },
      ];
      return jsonResponse({ success: false, count: rows.length, data: rows }, 401);
    }

    const rows = [
      {
        valid: true,
        matched: true,
        courseId: resolveCourseIdentifier(course),
      },
    ];

    return jsonResponse({ success: true, count: rows.length, data: rows });
  } catch (error) {
    // console.debug('[courses] Failed to verify course', error)
    return errorResponse(error);
  }
};
