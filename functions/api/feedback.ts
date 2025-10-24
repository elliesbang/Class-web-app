import type { Env } from './_utils';
import { ensureBaseSchema, errorResponse, jsonResponse, rowsToCamelCase } from './_utils';

type FeedbackRow = {
  id: number;
  user_name: string;
  comment: string;
  class_id: number;
  created_at: string;
};

type CreateFeedbackPayload = {
  userName?: string;
  comment?: string;
  classId?: number;
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  await ensureBaseSchema(env.DB);
  const { results } = await env.DB
    .prepare('SELECT id, user_name, comment, class_id, created_at FROM feedback ORDER BY created_at DESC, id DESC')
    .all<FeedbackRow>();

  const feedback = rowsToCamelCase(results);
  return jsonResponse({ feedback });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const payload = (await request.json().catch(() => null)) as CreateFeedbackPayload | null;

  if (!payload) {
    return errorResponse('잘못된 요청입니다.', 400);
  }

  const { userName, comment, classId } = payload;

  if (!userName || !comment || typeof classId !== 'number') {
    return errorResponse('userName, comment, classId는 필수 값입니다.', 400);
  }

  await ensureBaseSchema(env.DB);

  const statement = env.DB
    .prepare(
      'INSERT INTO feedback (user_name, comment, class_id) VALUES (?1, ?2, ?3) RETURNING id, user_name, comment, class_id, created_at',
    )
    .bind(userName, comment, classId);

  const { results } = await statement.all<FeedbackRow>();
  const [feedbackItem] = rowsToCamelCase(results);

  return jsonResponse({ feedback: feedbackItem }, { status: 201 });
};
