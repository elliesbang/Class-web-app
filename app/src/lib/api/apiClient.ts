import { supabase } from '@/lib/supabaseClient';

const API_BASE_URL = '/functions';

const resolveUrl = (input: string) => {
  if (/^https?:\/\//.test(input)) return input;

  const normalized = input.startsWith('/') ? input : `/${input}`;
  return `${API_BASE_URL}${normalized}`.replace(/\/{2,}/g, '/');
};

const parseJsonSafe = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  if (!text) return null as T;

  try {
    return JSON.parse(text) as T;
  } catch (e) {
    console.error('[apiClient] JSON parse error', e);
    throw new Error('서버 응답 처리 오류');
  }
};

export type ApiFetchOptions = RequestInit & { skipJsonParse?: boolean };

export const apiFetch = async <T = unknown>(
  url: string,
  options: ApiFetchOptions = {}
): Promise<T> => {
  const { skipJsonParse, headers, body, ...rest } = options;

  const resolvedUrl = resolveUrl(url);

  // ⭐ 현재 로그인된 Supabase 세션 token 얻기 (localStorage token 금지)
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? null;

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
    throw new Error(response.statusText || '요청 실패');
  }

  if (skipJsonParse || response.status === 204) {
    return null as T;
  }

  return parseJsonSafe<T>(response);
};