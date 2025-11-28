import { getAuthUser } from './authUser';

declare global {
  interface Window {
    __authFetchConfigured?: boolean;
  }
}

const shouldAttachHeaders = (resource: string): boolean => {
  try {
    const url = new URL(resource, window.location.origin);
    if (url.origin !== window.location.origin) {
      return false;
    }
    return url.pathname.startsWith('/.netlify/functions');
  } catch (error) {
    console.warn('[authFetch] Failed to parse request URL', resource, error);
    return false;
  }
};

const setup = () => {
  if (typeof window === 'undefined' || window.__authFetchConfigured) {
    return;
  }

  const originalFetch = window.fetch.bind(window);
  window.__authFetchConfigured = true;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
      const authUser = getAuthUser();

      if (!authUser || !authUser.token || !shouldAttachHeaders(url)) {
        return originalFetch(input, init);
      }

      const baseHeaders = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      baseHeaders.set('Authorization', `Bearer ${authUser.token}`);
      baseHeaders.set('X-User-Role', authUser.role);

      const nextInit: RequestInit = {
        ...init,
        headers: baseHeaders,
      };

      const nextInput = input instanceof Request ? new Request(input, nextInit) : input;
      return originalFetch(nextInput, nextInit);
    } catch (error) {
      console.error('[authFetch] Failed to decorate request', error);
      return originalFetch(input, init);
    }
  };
};

setup();
