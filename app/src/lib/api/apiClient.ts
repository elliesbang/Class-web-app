import { getAuthUser } from '../authUser';

const API_BASE_URL = '/api';

const resolveUrl = (input: string) => {
  if (/^https?:\/\//.test(input)) return input;
  const normalized = input.startsWith('/') ? input : `/${input}`;
  return `${API_BASE_URL}${normalized}`;
};

// 🔥 Supabase 토큰을 정확하게 가져오는 버전 (가장 중요!!)
const safeGetToken = () => {
  if (typeof window === 'undefined') return null;

  const storedToken = localStorage.getItem('token');
  if (storedToken) return storedToken;

  // ① 네가 직접 저장했을 가능성 있는 값
  const token1 = localStorage.getItem('sb-access-token');

  if (token1) return token1;

  // ② Supabase가 자동 저장하는 세션(JSON) 형태
  const raw = localStorage.getItem('supabase.auth.token');

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return parsed?.currentSession?.access_token ?? null;
    } catch {
      return null;
    }
  }

  return null;
};

const parseJsonSafe = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('JSON parse error', err);
    throw new Error('서버 응답 처리 실패');
  }
};

export async function apiFetch(url: string, options: any = {}) {
  const { skipJsonParse, headers, body, ...rest } = options;

  const resolvedUrl = resolveUrl(url);

  const token = safeGetToken(); // 🔥 이제 정상 토큰 나옴

  const mergedHeaders = new Headers(headers);
  mergedHeaders.set('Accept', 'application/json');

  // FormData가 아니라면 Content-Type 자동 지정
  if (!(body instanceof FormData)) {
    mergedHeaders.set('Content-Type', 'application/json');
  }

  // 🔥 Authorization 헤더가 정상적으로 붙음
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
