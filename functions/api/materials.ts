import type { Env } from './_utils';
import { ensureBaseSchema, errorResponse, jsonResponse, rowsToCamelCase } from './_utils';

type MaterialRow = {
  id: number;
  title: string;
  file_url: string;
  description: string | null;
  class_id: number;
  created_at: string;
};

type CreateMaterialPayload = {
  title?: string;
  fileUrl?: string;
  description?: string | null;
  classId?: number;
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  await ensureBaseSchema(env.DB);
  const { results } = await env.DB
    .prepare('SELECT id, title, file_url, description, class_id, created_at FROM materials ORDER BY created_at DESC, id DESC')
    .all<MaterialRow>();

  const materials = rowsToCamelCase(results);
  return jsonResponse({ materials });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const payload = (await request.json().catch(() => null)) as CreateMaterialPayload | null;

  if (!payload) {
    return errorResponse('잘못된 요청입니다.', 400);
  }

  const { title, fileUrl, description, classId } = payload;

  if (!title || !fileUrl || typeof classId !== 'number') {
    return errorResponse('title, fileUrl, classId는 필수 값입니다.', 400);
  }

  await ensureBaseSchema(env.DB);

  const statement = env.DB
    .prepare(
      'INSERT INTO materials (title, file_url, description, class_id) VALUES (?1, ?2, ?3, ?4) RETURNING id, title, file_url, description, class_id, created_at',
    )
    .bind(title, fileUrl, description ?? null, classId);

  const { results } = await statement.all<MaterialRow>();
  const [material] = rowsToCamelCase(results);

  return jsonResponse({ material }, { status: 201 });
};
