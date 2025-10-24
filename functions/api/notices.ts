import type { Env } from './_utils';
import { ensureBaseSchema, errorResponse, jsonResponse, rowsToCamelCase } from './_utils';

type NoticeRow = {
  id: number;
  title: string;
  content: string;
  author: string | null;
  class_id: number;
  created_at: string;
};

type CreateNoticePayload = {
  title?: string;
  content?: string;
  author?: string | null;
  classId?: number;
  class_id?: number;
};

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  await ensureBaseSchema(env.DB);

  const url = new URL(request.url);
  const classIdParam = url.searchParams.get('classId') ?? url.searchParams.get('class_id');

  let statement = env.DB.prepare(
    'SELECT id, title, content, author, class_id, created_at FROM notices ORDER BY created_at DESC, id DESC',
  );

  if (classIdParam !== null) {
    const parsedClassId = Number(classIdParam);
    if (Number.isNaN(parsedClassId)) {
      return errorResponse('유효하지 않은 classId 입니다.', 400);
    }

    statement = env.DB
      .prepare(
        'SELECT id, title, content, author, class_id, created_at FROM notices WHERE class_id = ?1 ORDER BY created_at DESC, id DESC',
      )
      .bind(parsedClassId);
  }

  const { results } = await statement.all<NoticeRow>();

  const notices = rowsToCamelCase(results);
  return jsonResponse({ notices });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const payload = (await request.json().catch(() => null)) as CreateNoticePayload | null;

  if (!payload) {
    return errorResponse('잘못된 요청입니다.', 400);
  }

  const { title, content, author, classId, class_id } = payload;
  const resolvedClassId =
    typeof classId === 'number' ? classId : typeof class_id === 'number' ? class_id : Number.NaN;

  if (!title || !content || Number.isNaN(resolvedClassId)) {
    return errorResponse('title, content, classId는 필수 값입니다.', 400);
  }

  await ensureBaseSchema(env.DB);

  const statement = env.DB
    .prepare(
      'INSERT INTO notices (title, content, author, class_id) VALUES (?1, ?2, ?3, ?4) RETURNING id, title, content, author, class_id, created_at',
    )
    .bind(title, content, author ?? null, resolvedClassId);

  const { results } = await statement.all<NoticeRow>();
  const [notice] = rowsToCamelCase(results);

  return jsonResponse({ notice }, { status: 201 });
};
