// functions/api/classes/create.ts

import {
  assertMethod,
  handleApi,
  requireJsonBody,
  jsonResponse
} from '../../_utils/api';
import { verifyToken, assertRole } from '../../_utils/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    // POST만 허용
    assertMethod(request, 'POST');

    // 관리자 권한 체크
    const user = await verifyToken(request, env);
    assertRole(user, 'admin');

    // body 파싱
    const body = await requireJsonBody(request);

    const result = await env.DB.prepare(
      `INSERT INTO classes 
        (name, code, category, category_id, start_date, end_date, duration,
         assignment_upload_time, assignment_upload_days, delivery_methods,
         is_active, created_at, updated_at)
       VALUES (?1, ?2, ?3, NULL, ?4, ?5, '', ?6, ?7, ?8, ?9, datetime('now'), datetime('now'))`
    )
      .bind(
        body.name,
        body.code,
        body.category,
        body.startDate,
        body.endDate,
        body.assignmentUploadTime,
        JSON.stringify(body.assignmentUploadDays),
        JSON.stringify(body.deliveryMethods),
        body.isActive ? 1 : 0
      )
      .run();

    return jsonResponse({
      success: true,
      id: result.lastRowId
    });
  });
