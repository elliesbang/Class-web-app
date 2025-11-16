const defaultHeaders = {
  'Content-Type': 'application/json',
};

export const jsonResponse = (data, init = {}) => {
  const body = JSON.stringify(data);
  const headers = { ...defaultHeaders, ...(init.headers || {}) };
  return new Response(body, { ...init, headers });
};

export const errorResponse = (message, status = 500) =>
  jsonResponse({ success: false, error: message }, { status });
