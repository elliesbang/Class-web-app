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

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    const method = request.method.toUpperCase();
    const db = env.DB;

    if (method === 'GET') {
      const { results } = await db
        .prepare('SELECT * FROM classes ORDER BY created_at DESC')
        .all();

      return jsonResponse({ classes: results });
    }

    if (method === 'POST') {
      assertMethod(request, 'POST');

      const user = await verifyToken(request, env);
      assertRole(user, 'admin');

      const body = await requireJsonBody<Record<string, unknown>>(request);

      const {
        name = '',
        code = '',
        category = '',
        category_id = 0,
        start_date = '',
        end_date = '',
        duration = '',
        assignment_upload_time = '',
        assignment_upload_days = '',
        delivery_methods = '',
        is_active = 1,
      } = (body || {}) as {
        name?: string;
        code?: string;
        category?: string;
        category_id?: number;
        start_date?: string;
        end_date?: string;
        duration?: string;
        assignment_upload_time?: string;
        assignment_upload_days?: string;
        delivery_methods?: string;
        is_active?: number;
      };

      if (!name || !code) {
        throw new ApiError(400, { error: 'name and code are required' });
      }

      const result = await db
        .prepare(
          `INSERT INTO classes (
            name,
            code,
            category,
            category_id,
            start_date,
            end_date,
            duration,
            assignment_upload_time,
            assignment_upload_days,
            delivery_methods,
            is_active,
            created_at,
            updated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        )
        .bind(
          name,
          code,
          category,
          category_id,
          start_date,
          end_date,
          duration,
          assignment_upload_time,
          assignment_upload_days,
          delivery_methods,
          is_active,
        )
        .run();

      const created = await db
        .prepare('SELECT * FROM classes WHERE id = ?1')
        .bind(result.lastRowId)
        .first();

      return jsonResponse({ success: true, class: created, id: result.lastRowId });
    }

    throw new ApiError(405, { error: 'Method Not Allowed' });
  });
