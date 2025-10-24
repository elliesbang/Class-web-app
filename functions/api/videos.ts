import type { Env } from './_utils';
import { ensureBaseSchema, errorResponse, jsonResponse, rowsToCamelCase, seedBaseClasses } from './_utils';

type VideoRow = {
  id: number;
  title: string;
  url: string;
  description: string | null;
  class_id: number;
  created_at: string;
};

type CreateVideoPayload = {
  title?: string;
  url?: string;
  description?: string | null;
  classId?: number;
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  await ensureBaseSchema(env.DB);
  await seedBaseClasses(env.DB);
  const { results } = await env.DB.prepare(
    'SELECT id, title, url, description, class_id, created_at FROM videos ORDER BY created_at DESC, id DESC',
  ).all<VideoRow>();

  const videos = rowsToCamelCase(results);
  return jsonResponse({ videos });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const payload = (await request.json().catch(() => null)) as CreateVideoPayload | null;

  if (!payload) {
    return errorResponse('잘못된 요청입니다.', 400);
  }

  const { title, url, description, classId } = payload;

  if (!title || !url || typeof classId !== 'number') {
    return errorResponse('title, url, classId는 필수 값입니다.', 400);
  }

  await ensureBaseSchema(env.DB);
  await seedBaseClasses(env.DB);

  const classExists = await env.DB.prepare('SELECT 1 FROM classes WHERE id = ?1').bind(classId).first();
  if (!classExists) {
    return errorResponse('존재하지 않는 수업입니다.', 400);
  }

  const insertResult = await env.DB
    .prepare('INSERT INTO videos (title, url, description, class_id) VALUES (?1, ?2, ?3, ?4)')
    .bind(title, url, description ?? null, classId)
    .run();

  if (!insertResult.success) {
    return errorResponse('영상 정보를 저장하는 중 오류가 발생했습니다.', 500);
  }

  const extractLastInsertId = (meta: unknown) => {
    if (!meta || typeof meta !== 'object') {
      return null;
    }

    const metadata = meta as Record<string, unknown>;
    const candidateKeys = ['last_row_id', 'lastRowId', 'lastInsertRowid', 'lastInsertRowId'];
    for (const key of candidateKeys) {
      const value = metadata[key];
      if (typeof value === 'number') {
        return value;
      }
    }
    return null;
  };

  const insertedId = extractLastInsertId(insertResult.meta);

  const videoRow = insertedId
    ? await env.DB
        .prepare('SELECT id, title, url, description, class_id, created_at FROM videos WHERE id = ?1')
        .bind(insertedId)
        .first<VideoRow>()
    : await env.DB
        .prepare('SELECT id, title, url, description, class_id, created_at FROM videos ORDER BY id DESC LIMIT 1')
        .first<VideoRow>();

  if (!videoRow) {
    return errorResponse('영상 정보를 확인할 수 없습니다.', 500);
  }
  const [video] = rowsToCamelCase([videoRow]);

  return jsonResponse({ video }, { status: 201 });
};
