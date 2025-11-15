const rawBaseUrl = (import.meta.env?.VITE_API_BASE_URL ?? '/api') as string;

const API_BASE_URL = rawBaseUrl.trim() || '/api';

const isAbsoluteBaseUrl = /^https?:\/\//.test(API_BASE_URL);

const normaliseRelativeBasePath = (value: string): string => {
  if (!value || value === '/') {
    return '';
  }

  const withoutTrailingSlash = value.replace(/\/+$/, '');
  return withoutTrailingSlash.startsWith('/') ? withoutTrailingSlash : `/${withoutTrailingSlash}`;
};

const relativeBasePath = isAbsoluteBaseUrl ? '' : normaliseRelativeBasePath(API_BASE_URL);

const absoluteBaseUrl = isAbsoluteBaseUrl
  ? API_BASE_URL.endsWith('/')
    ? API_BASE_URL
    : `${API_BASE_URL}/`
  : null;

const resolveRequestUrl = (input: string): string => {
  if (/^https?:\/\//.test(input)) {
    return input;
  }

  if (absoluteBaseUrl) {
    return new URL(input, absoluteBaseUrl).toString();
  }

  if (input.startsWith('/')) {
    if (!relativeBasePath || input.startsWith(relativeBasePath)) {
      return input;
    }

    return `${relativeBasePath}${input}`.replace(/\/{2,}/g, '/');
  }

  if (!relativeBasePath) {
    return `/${input}`.replace(/\/{2,}/g, '/');
  }

  return `${relativeBasePath}/${input}`.replace(/\/{2,}/g, '/');
};

type HeaderTuple = [string, string];

type ApiFetchOptions = RequestInit & {
  /**
   * When set to true, the API client skips JSON parsing and returns null.
   * Useful for endpoints that intentionally do not send any body (e.g. 204 responses).
   */
  skipJsonParse?: boolean;
};

const toHeaderTuples = (headers: HeadersInit | undefined): HeaderTuple[] => {
  if (!headers) {
    return [];
  }

  if (headers instanceof Headers) {
    return Array.from(headers.entries());
  }

  if (Array.isArray(headers)) {
    return headers.map(([key, value]) => [String(key), String(value ?? '')]);
  }

  return Object.entries(headers).map(([key, value]) => [key, String(value ?? '')]);
};

const createMergedHeaders = (headers: HeadersInit | undefined): Headers => {
  const merged = new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json',
  });

  toHeaderTuples(headers).forEach(([key, value]) => {
    merged.set(key, value);
  });

  return merged;
};

const extractErrorMessage = async (response: Response): Promise<string> => {
  try {
    const text = await response.text();
    if (!text) {
      return response.statusText || '알 수 없는 오류가 발생했습니다.';
    }

    try {
      const data = JSON.parse(text) as { message?: string } | { error?: string } | undefined;
      if (data && typeof data === 'object') {
        const message = 'message' in data ? data.message : 'error' in data ? data.error : undefined;
        if (message) {
          return message;
        }
      }
    } catch {
      // ignore JSON parse errors, fallback to plain text
    }

    return text;
  } catch (error) {
    console.error('[API ERROR] Failed to read error response body.', error);
    return response.statusText || '알 수 없는 오류가 발생했습니다.';
  }
};

export async function apiFetch<T = unknown>(url: string, options: ApiFetchOptions = {}): Promise<T> {
  const { skipJsonParse, ...init } = options;
  const mergedOptions: RequestInit = {
    ...init,
    headers: createMergedHeaders(init.headers),
  };

  const requestUrl = resolveRequestUrl(url);

  // const response = await fetch(requestUrl, mergedOptions);
  // if (!response.ok) {
  //   const errorMessage = await extractErrorMessage(response.clone());
  //   console.error(`[API ERROR] ${requestUrl} →`, errorMessage);
  //   throw new Error(`API 요청 실패: ${response.status} ${errorMessage}`.trim());
  // }

  // if (skipJsonParse) {
  //   return null as T;
  // }

  // const contentLength = response.headers.get('content-length');
  // if (response.status === 204 || contentLength === '0') {
  //   return null as T;
  // }

  // const text = await response.text();

  // if (!text) {
  //   return null as T;
  // }

  // try {
  //   return JSON.parse(text) as T;
  // } catch (error) {
  //   console.error('[JSON PARSE ERROR]', error);
  //   throw new Error('서버에서 JSON 응답을 받지 못했습니다.');
  // }

  return null as T;
}

export type { ApiFetchOptions };
