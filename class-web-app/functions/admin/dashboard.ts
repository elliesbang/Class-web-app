import { Hono } from 'hono';

type Env = {
  CLOUDFLARE_API_TOKEN?: string;
  DATABASE_ID?: string;
  DATABASE_NAME?: string;
  DB?: D1Database;
};

type AppEnv = {
  Bindings: Env;
};

type PagesContext<Bindings> = {
  request: Request;
  env: Bindings;
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
};

type PagesHandler<Bindings> = (context: PagesContext<Bindings>) => Promise<Response> | Response;

const app = new Hono<AppEnv>();

const jsonError = (message: string, status = 500) =>
  Response.json(
    {
      error: true,
      message,
    },
    { status },
  );

const createMissingEnvResponse = () => jsonError('환경변수를 불러오지 못했습니다.');

const fetchDashboardData = async (env: Required<Env>) => {
  const { DB, DATABASE_ID, DATABASE_NAME } = env;

  const { results } = await DB.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
  ).all<{ name?: string }>();

  const tables = (results ?? [])
    .map((row) => row?.name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0);

  return {
    success: true as const,
    data: {
      databaseId: DATABASE_ID,
      databaseName: DATABASE_NAME,
      tokenAvailable: true,
      tables,
    },
  };
};

const handleDashboardRequest = async (env: Env) => {
  const { CLOUDFLARE_API_TOKEN, DATABASE_ID, DATABASE_NAME, DB } = env;

  if (!CLOUDFLARE_API_TOKEN || !DATABASE_ID || !DATABASE_NAME || !DB) {
    return createMissingEnvResponse();
  }

  try {
    const payload = await fetchDashboardData({
      CLOUDFLARE_API_TOKEN,
      DATABASE_ID,
      DATABASE_NAME,
      DB,
    });

    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    console.error('[admin/dashboard] Failed to load dashboard data', error);
    return jsonError(`서버 오류: ${message}`);
  }
};

app.get('/', (c) => handleDashboardRequest(c.env));
app.post('/', (c) => handleDashboardRequest(c.env));

const onRequest: PagesHandler<Env> = (context) => app.fetch(context.request, context.env, context);

export const onRequestGet: PagesHandler<Env> = (context) => onRequest(context);
export const onRequestPost: PagesHandler<Env> = (context) => onRequest(context);

export default app;
