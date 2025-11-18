import { assertMethod, handleApi, jsonResponse, requireJsonBody } from '../../_utils/api';
import { assertRole, verifyToken } from '../../_utils/auth';

export async function onRequest({ request, env }) {
  return handleApi(async () => {
    assertMethod(request, 'POST');

    // 인증
    const user = await verifyToken(request, env);
    assertRole(user, 'admin');

    const body = await requireJsonBody(request);

    const classId = body.class_id || body.classroom_id;
    const tab = body.tab; // 관리자 UI가 보내는 탭 이름
    const title = body.title || '';
    const description = body.description || '';
    const url = body.content_url || body.url || null;
    const thumbnail = body.thumbnail_url || null;
    const orderNum = body.order_num || 0;

    if (!classId) {
      return jsonResponse({ error: 'Missing class_id' }, 400);
    }
    if (!tab) {
      return jsonResponse({ error: 'Missing tab' }, 400);
    }

    // 탭 → 실제 테이블 매핑
    const tableMap = {
      globalNotice: 'global_notice',
      classroomNotice: 'classroom_notice',
      classroomVideo: 'classroom_video',
      vodVideo: 'vod_video',
      material: 'material',
    };

    const table = tableMap[tab];
    if (!table) {
      return jsonResponse({ error: 'Invalid tab' }, 400);
    }

    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO ${table}
        (class_id, classroom_id, type, title, description, content_url, thumbnail_url, order_num, created_at, updated_at)
       VALUES (?1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)`
    )
      .bind(classId, tab, title, description, url, thumbnail, orderNum, now)
      .run();

    // 저장 후 최신 목록 반환
    const { results } = await env.DB.prepare(
      `SELECT * FROM ${table}
       WHERE class_id = ?1
       ORDER BY order_num ASC, created_at DESC`
    )
      .bind(classId)
      .all();

    return jsonResponse({ results });
  });
}
