export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super(typeof payload === 'string' ? payload : JSON.stringify(payload));
    this.status = status;
    this.payload = typeof payload === 'string' ? { error: payload } : payload;
  }
}

export const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export const handleApi = async (handler: () => Promise<Response>): Promise<Response> => {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonResponse(error.payload, error.status);
    }
    console.error('[API] Unhandled error', error);
    return jsonResponse({ error: 'Internal Server Error' }, 500);
  }
};

export const requireJsonBody = async <T>(request: Request): Promise<T> => {
  try {
    return (await request.json()) as T;
  } catch (error) {
    console.warn('[API] Failed to parse JSON body.', error);
    throw new ApiError(400, { error: 'Invalid JSON body' });
  }
};

export const assertMethod = (request: Request, method: string) => {
  if (request.method.toUpperCase() !== method.toUpperCase()) {
    throw new ApiError(405, { error: 'Method Not Allowed' });
  }
};
