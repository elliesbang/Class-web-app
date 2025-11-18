import { getStoredAuthUser } from '../authUser';

const API_BASE_URL = '/api';

const resolveUrl = (input: string) => {
  if (/^https?:\/\//.test(input)) {
    return input;
  }
  const normalised = input.startsWith('/') ? input : `/${input}`;
  return `${API_BASE_URL}${normalised}`.replace(/\/{2,}/g, '/');
};

const parseJsonSafe = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  if (!text) {
    return null as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.error('[apiClient] JSON parse error', error);
    throw new Error('서버 응답을 처리하지 못했습니다.');
  }
};

export type ApiFetchOptions = RequestInit & { skipJsonParse?: boolean };

export const apiFetch = async <T = unknown>(url: string, options: ApiFetchOptions = {}): Promise<T> => {
  const { skipJsonParse, headers, body, ...rest } = options;
  const resolvedUrl = resolveUrl(url);
  const token = getStoredAuthUser()?.token;
  const mergedHeaders = new Headers(headers);
  mergedHeaders.set('Accept', 'application/json');
  if (!(body instanceof FormData)) {
    mergedHeaders.set('Content-Type', 'application/json');
  }
  if (token) {
    mergedHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(resolvedUrl, {
    ...rest,
    body,
    headers: mergedHeaders,
  });

  if (!response.ok) {
    const message = response.statusText || '요청에 실패했습니다.';
    throw new Error(message);
  }

  if (skipJsonParse || response.status === 204) {
    return null as T;
  }

  return parseJsonSafe<T>(response);
};
