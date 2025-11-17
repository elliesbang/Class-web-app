import { jsonResponse } from '../../_utils/api';

export const onRequest = async ({ env }) => {
  const result = await env.DB.prepare('SELECT * FROM class_category').all();
  return jsonResponse(result.results ?? []);
};
