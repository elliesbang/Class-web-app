import type { Env } from './_utils';
import { fetchClasses, jsonResponse } from './_utils';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const classes = await fetchClasses(env.DB);
  return jsonResponse({ classes });
};
