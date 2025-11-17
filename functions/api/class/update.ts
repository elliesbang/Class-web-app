import { ApiError, assertMethod, handleApi, jsonResponse, requireJsonBody } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';
import { z } from 'zod';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

const UpdateClassSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string().min(1),
  code: z.string().min(1),
  category: z.string().optional(),
  category_id: z.union([z.number(), z.null()]).optional(),
  start_date: z.string(),
  end_date: z.string(),
  duration: z.string().optional(),
  assignment_upload_time: z.string().optional(),
  assignment_upload_days: z.array(z.union([z.string(), z.number()])).optional(),
  delivery_methods: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
});

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'PUT');

    const user = await verifyToken(request, env);
    assertRole(user, 'admin');

    const rawBody = await requireJsonBody(request);
    const parsed = UpdateClassSchema.safeParse(rawBody);

    if (!parsed.success) {
      throw new ApiError(400, { error: parsed.error.flatten() });
    }

    const body = parsed.data;
    const idValue = typeof body.id === 'string' ? Number(body.id) : body.id;
    if (!Number.isFinite(idValue)) {
      throw new ApiError(400, { error: 'Valid class id is required' });
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    const pushUpdate = (column: string, value: unknown) => {
      updates.push(`${column} = ?${updates.length + 1}`);
      values.push(value);
    };

    pushUpdate('name', body.name);
    pushUpdate('code', body.code);

    if (typeof body.category !== 'undefined') {
      pushUpdate('category', body.category);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'category_id')) {
      pushUpdate('category_id', body.category_id ?? null);
    }

    if (typeof body.start_date !== 'undefined') {
      pushUpdate('start_date', body.start_date);
    }

    if (typeof body.end_date !== 'undefined') {
      pushUpdate('end_date', body.end_date);
    }

    if (typeof body.duration !== 'undefined') {
      pushUpdate('duration', body.duration);
    }

    if (typeof body.assignment_upload_time !== 'undefined') {
      pushUpdate('assignment_upload_time', body.assignment_upload_time);
    }

    if (typeof body.assignment_upload_days !== 'undefined') {
      pushUpdate('assignment_upload_days', JSON.stringify(body.assignment_upload_days));
    }

    if (typeof body.delivery_methods !== 'undefined') {
      pushUpdate('delivery_methods', JSON.stringify(body.delivery_methods));
    }

    if (typeof body.is_active !== 'undefined') {
      pushUpdate('is_active', body.is_active ? 1 : 0);
    }

    updates.push("updated_at = datetime('now')");

    const query = `UPDATE classes SET ${updates.join(', ')} WHERE id = ?${values.length + 1}`;
    await env.DB.prepare(query).bind(...values, idValue).run();

    return jsonResponse({ success: true, id: idValue });
  });
