import { ApiError, assertMethod, handleApi, jsonResponse, requireJsonBody } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';
import { z } from 'zod';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

const UpdateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  parent_id: z.union([z.number(), z.string(), z.null()]).optional(),
});

const parseId = (value: string | null, fieldLabel: string): number => {
  if (!value) {
    throw new ApiError(400, { error: `${fieldLabel} is required` });
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new ApiError(400, { error: `${fieldLabel} must be a valid number` });
  }

  return numeric;
};

const parseParentId = (value: unknown): number | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
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
    assertMethod(request, 'PUT');

    const user = await verifyToken(request, env);
    assertRole(user, 'admin');

    const url = new URL(request.url);
    const id = parseId(url.searchParams.get('id'), 'id');

    const rawBody = await requireJsonBody(request);
    const parsed = UpdateCategorySchema.safeParse(rawBody);

    if (!parsed.success) {
      throw new ApiError(400, { error: parsed.error.flatten() });
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (Object.prototype.hasOwnProperty.call(parsed.data, 'name')) {
      updates.push(`name = ?${updates.length + 1}`);
      values.push(parsed.data.name);
    }

    if (Object.prototype.hasOwnProperty.call(parsed.data, 'parent_id')) {
      const parentId = parseParentId(parsed.data.parent_id);
      updates.push(`parent_id = ?${updates.length + 1}`);
      values.push(parentId ?? null);
    }

    if (updates.length === 0) {
      throw new ApiError(400, { error: 'No fields provided for update' });
    }

    const query = `UPDATE class_category SET ${updates.join(', ')} WHERE id = ?${values.length + 1}`;
    await env.DB.prepare(query).bind(...values, id).run();

    return jsonResponse({ success: true, id });
  });
