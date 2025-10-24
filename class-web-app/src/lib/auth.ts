const ADMIN_AUTH_STORAGE_KEY = 'adminAuth';
const ADMIN_AUTH_CHANGE_EVENT = 'ellie-admin-auth-change';

const readAdminAuthFlag = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === 'true';
  } catch (error) {
    console.warn('[auth] Failed to read admin auth flag from storage.', error);
    return false;
  }
};

export const isAdminAuthenticated = (): boolean => readAdminAuthFlag();

export const emitAdminAuthChange = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(ADMIN_AUTH_CHANGE_EVENT));
};

type AdminAuthListener = (isAuthenticated: boolean) => void;

export const subscribeAdminAuthChanges = (listener: AdminAuthListener) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const notify = () => {
    listener(readAdminAuthFlag());
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === ADMIN_AUTH_STORAGE_KEY) {
      notify();
    }
  };

  const handleFocus = () => {
    notify();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      notify();
    }
  };

  const handleCustomEvent = () => {
    notify();
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener(ADMIN_AUTH_CHANGE_EVENT, handleCustomEvent);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener(ADMIN_AUTH_CHANGE_EVENT, handleCustomEvent);
  };
};

export { ADMIN_AUTH_STORAGE_KEY, ADMIN_AUTH_CHANGE_EVENT };
