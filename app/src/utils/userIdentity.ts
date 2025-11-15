const STORAGE_KEY = 'classWebAppUserId';

const generateRandomId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const random = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return `${timestamp}-${random}`;
};

export const getOrCreateUserId = (): string => {
  if (typeof window === 'undefined') {
    return 'guest';
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && stored.trim().length > 0) {
      return stored;
    }

    const newId = generateRandomId();
    window.localStorage.setItem(STORAGE_KEY, newId);
    return newId;
  } catch (error) {
    console.warn('[userIdentity] failed to access localStorage', error);
    return 'guest';
  }
};

export const getUserIdFromRequestInit = (): string => {
  if (typeof window === 'undefined') {
    return 'guest';
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && stored.trim().length > 0) {
      return stored;
    }
  } catch (error) {
    console.warn('[userIdentity] failed to read user id', error);
  }

  return getOrCreateUserId();
};
