// functions/api/content/create.ts

import {
  assertMethod,
  handleApi,
  requireJsonBody,
  jsonResponse,
} from '../../_utils/api';
import { verifyToken, assertRole } from '../../_utils/auth';

export const onRequest = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'POST');

    const admin = await verifyToken(request, env);
    assertRole(admin, 'admin');

    const body = await requireJsonBody(request);

    const {
      type,             // global | classroom | vod
      title,
      content,
      url,
      is_visible,
      class_category_id,
      vod_category_id,
    } = body;

    let query = '';
    let params: any[] = [];

    // 📌 1) 전체 공지 (카테고리 없음)
    if (type === 'global') {
      query = `
        INSERT INTO global_notice (title, content, is_visible, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `;
      params = [title, content, is_visible ? 1 : 0];
    }

    // 📌 2) 강의실 콘텐츠 (class_category_id 필수)
    else if (type === 'classroom') {
      query = `
        INSERT INTO classroom_content
          (title, content, url, class_category_id, is_visible, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `;
      params = [
        title,
        content ?? null,
        url ?? null,
        class_category_id,
        is_visible ? 1 : 0,
      ];
    }

    // 📌 3) VOD 콘텐츠 (vod_category_id 필수)
    else if (type === 'vod') {
      query = `
        INSERT INTO vod_video
          (title, url, vod_category_id, is_visible, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `;
      params = [title, url, vod_category_id, is_visible ? 1 : 0];
    }

    else {
      throw new Error('Invalid type');
    }

    await env.DB.prepare(query).bind(...params).run();
    return jsonResponse({ success: true });
  });
