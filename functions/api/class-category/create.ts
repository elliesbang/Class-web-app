import { ApiError, assertMethod, handleApi, jsonResponse, requireJsonBody } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';
import { z } from 'zod';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

const CreateCategorySchema = z.object({
  name: z.string().min(1),
  parent_id: z.union([z.number(), z.string(), z.null()]).optional(),
});

const parseParentId = (value: unknown): number | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numeric = typeof value === 'string' ? Number(value) : value;

  if (typeof numeric === 'number' && Number.isFinite(numeric)) {
    return numeric;
  }

  throw new ApiError(400, { error: 'parent_id must be a valid number or null' });
};

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'POST');

    const user = await verifyToken(request, env);
    assertRole(user, 'admin');

    const rawBody = await requireJsonBody(request);
    const parsed = CreateCategorySchema.safeParse(rawBody);

    if (!parsed.success) {
      throw new ApiError(400, { error: parsed.error.flatten() });
    }

    const parentId = parseParentId(parsed.data.parent_id);

    const result = await env.DB.prepare(
      `INSERT INTO class_category (name, parent_id)
       VALUES (?1, ?2)`,
    )
      .bind(parsed.data.name, parentId)
      .run();

    const id = result.meta?.last_row_id ?? null;

    return jsonResponse({ success: true, id });
  });
