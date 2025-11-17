import {
  ApiError,
  assertMethod,
  handleApi,
  jsonResponse,
  requireJsonBody,
} from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

const parseId = (value: string | undefined) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ApiError(400, { error: 'Valid class id is required' });
  }
  return numeric;
};

const fetchClassById = async (db: D1Database, id: number) =>
  db.prepare('SELECT * FROM classes WHERE id = ?1').bind(id).first();

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) =>
  handleApi(async () => {
    const method = request.method.toUpperCase();
    const id = parseId(params?.id as string | undefined);

    if (method === 'GET') {
      const record = await fetchClassById(env.DB, id);
      if (!record) {
        throw new ApiError(404, { error: 'Class not found' });
      }
      return jsonResponse({ class: record });
    }

    if (method === 'PUT') {
      assertMethod(request, 'PUT');
      const user = await verifyToken(request, env);
      assertRole(user, 'admin');

      const body = await requireJsonBody<Record<string, unknown>>(request);

      const toStringValue = (value: unknown, fallback = ''): string => {
        if (typeof value === 'string') return value.trim();
        if (value == null) return fallback;
        return String(value).trim();
      };

      const toArrayValue = (value: unknown): unknown[] => {
        if (Array.isArray(value)) return value;
        return [];
      };

      const name = toStringValue(body.name);
      const code = toStringValue(body.code);

      if (!name || !code) {
        throw new ApiError(400, { error: 'name and code are required' });
      }

      const category = toStringValue(body.category);
      const categoryId = Number(body.categoryId ?? body.category_id);
      const startDate = toStringValue(body.startDate ?? body.start_date, '') || null;
      const endDate = toStringValue(body.endDate ?? body.end_date, '') || null;
      const duration = toStringValue(body.duration, '');
      const assignmentUploadTime = toStringValue(body.assignmentUploadTime ?? body.assignment_upload_time, 'all_day');
      const assignmentUploadDays = toArrayValue(
        body.assignmentUploadDays ?? body.assignment_upload_days,
      );
      const deliveryMethods = toArrayValue(body.deliveryMethods ?? body.delivery_methods);
      const isActive = Boolean(body.isActive ?? body.is_active ?? true) ? 1 : 0;

      await env.DB
        .prepare(
          `UPDATE classes SET
            name = ?1,
            code = ?2,
            category = ?3,
            category_id = ?4,
            start_date = ?5,
            end_date = ?6,
            duration = ?7,
            assignment_upload_time = ?8,
            assignment_upload_days = ?9,
            delivery_methods = ?10,
            is_active = ?11,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?12`
        )
        .bind(
          name,
          code,
          category,
          Number.isFinite(categoryId) ? categoryId : null,
          startDate,
          endDate,
          duration,
          assignmentUploadTime,
          JSON.stringify(assignmentUploadDays),
          JSON.stringify(deliveryMethods),
          isActive,
          id,
        )
        .run();

      const record = await fetchClassById(env.DB, id);

      return jsonResponse({ success: true, class: record, id });
    }

    if (method === 'DELETE') {
      assertMethod(request, 'DELETE');
      const user = await verifyToken(request, env);
      assertRole(user, 'admin');

      await env.DB.prepare('DELETE FROM classes WHERE id = ?1').bind(id).run();

      return jsonResponse({ success: true, id });
    }

    throw new ApiError(405, { error: 'Method Not Allowed' });
  });
