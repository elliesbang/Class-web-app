import { assertMethod, handleApi, jsonResponse } from '../../_utils/api';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

type ClassCategoryRecord = {
  id: number;
  name: string;
  parent_id: number | null;
};

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => {
    assertMethod(request, 'GET');

    // 🔥 인증 제거 (중요)
    // const user = await verifyToken(request, env);
    // assertRole(user, 'admin');

    const result = await env.DB.prepare(
      `SELECT id, name, parent_id
       FROM class_category
       ORDER BY id ASC;`,
    ).all();

    const records: ClassCategoryRecord[] = (result.results ?? []).map((item: any) => ({
      id: Number(item.id),
      name: String(item.name ?? ''),
      parent_id: item.parent_id == null ? null : Number(item.parent_id),
    }));

    return jsonResponse(records);
  });
