import { getAuthUser } from '../authUser';

const API_BASE_URL = '/api';

const resolveUrl = (input: string) => {
  if (/^https?:\/\//.test(input)) return input;
  const normalized = input.startsWith('/') ? input : `/${input}`;
  return `${API_BASE_URL}${normalized}`;
};

// ❗ Node 환경(localStorage 없음) 보호
const safeGetToken = () => {
  if (typeof window === 'undefined') return null;
  return getAuthUser()?.accessToken ?? null;
};

const parseJsonSafe = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('JSON parse error', err);
    throw new Error('서버 응답 처리 실패');
  }
};

export async function apiFetch(url, options = {}) {
  const { skipJsonParse, headers, body, ...rest } = options;
  const resolvedUrl = resolveUrl(url);

  const token = safeGetToken(); // 🔥 SSR-safe 토큰 접근

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
    const message = response.statusText || 'API 요청 실패';
    throw new Error(message);
  }

  if (skipJsonParse || response.status === 204) {
    return null;
  }

  return parseJsonSafe(response);
}