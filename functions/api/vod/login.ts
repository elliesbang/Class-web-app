import { handleLoginRequest } from '../../_utils/login';
import { handleApi } from '../../_utils/api';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  handleApi(async () => handleLoginRequest(request, env, 'vod'));
