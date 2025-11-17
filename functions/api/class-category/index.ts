import { jsonResponse } from '../../_utils/api';

type ClassCategoryRecord = {
  id: number;
  name: string;
  parent_id: number | null;
};

export const onRequest = async ({ env }) => {
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
};
