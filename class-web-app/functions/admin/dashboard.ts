interface Env {
  CLOUDFLARE_API_TOKEN?: string;
  DATABASE_ID?: string;
  DATABASE_NAME?: string;
  DB?: D1Database;
}

interface PagesContext<Bindings> {
  request: Request;
  env: Bindings;
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

type PagesHandler<Bindings> = (context: PagesContext<Bindings>) => Promise<Response> | Response;

const createJsonError = (message: string, status = 500) =>
  Response.json(
    {
      error: true,
      message,
    },
    { status },
  );

const fetchClasses = async (db: D1Database) => {
  const { results } = await db.prepare('SELECT * FROM classes;').all();
  return results ?? [];
};

const createDashboardResponse = (data: unknown[]) =>
  Response.json({
    success: true,
    data,
  });

const validateEnv = (env: Env) => {
  const { CLOUDFLARE_API_TOKEN, DATABASE_ID, DATABASE_NAME, DB } = env;

  if (!CLOUDFLARE_API_TOKEN || !DATABASE_ID || !DATABASE_NAME || !DB) {
    return null;
  }

  return { CLOUDFLARE_API_TOKEN, DATABASE_ID, DATABASE_NAME, DB } as Required<Env>;
};

const handleRequest = async (context: PagesContext<Env>) => {
  const validatedEnv = validateEnv(context.env);

  if (!validatedEnv) {
    return createJsonError('환경변수를 불러오지 못했습니다.');
  }

  const { DB } = validatedEnv;

  try {
    const classes = await fetchClasses(DB);
    return createDashboardResponse(classes);
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return createJsonError(`서버 오류: ${message}`);
  }
};

export const onRequestGet: PagesHandler<Env> = (context) => handleRequest(context);

export default onRequestGet;
