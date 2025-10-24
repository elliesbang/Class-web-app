import { isAdminAuthenticated } from './auth';

export const COURSE_ACCESS_STORAGE_KEY = 'ellieCourseAccess';
export const COURSE_ACCESS_CHANGE_EVENT = 'ellie-course-access-change';

type CourseAccessState =
  | { mode: 'all' }
  | { mode: 'set'; values: Set<string> };

const normaliseCourseId = (value: unknown) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
};

const parseCourseAccessValue = (raw: string | null): CourseAccessState => {
  if (!raw) {
    return { mode: 'all' };
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { mode: 'all' };
  }

  if (trimmed === '*' || trimmed.toLowerCase() === 'all') {
    return { mode: 'all' };
  }

  let parsed: unknown = trimmed;

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      parsed = JSON.parse(trimmed);
    } catch (error) {
      console.warn('[course-access] Failed to parse JSON access config.', error);
      parsed = trimmed;
    }
  }

  const values = new Set<string>();

  const push = (candidate: unknown) => {
    const normalised = normaliseCourseId(candidate);
    if (normalised) {
      values.add(normalised);
    }
  };

  if (Array.isArray(parsed)) {
    parsed.forEach(push);
  } else if (typeof parsed === 'string') {
    parsed
      .split(',')
      .map((item) => item.trim())
      .forEach(push);
  } else if (parsed && typeof parsed === 'object') {
    const candidate = parsed as { courses?: unknown } & Record<string, unknown>;
    if (Array.isArray(candidate.courses)) {
      candidate.courses.forEach(push);
    } else {
      Object.entries(candidate).forEach(([key, value]) => {
        if (value !== false) {
          push(key);
        }
      });
    }
  }

  if (values.size === 0) {
    return { mode: 'all' };
  }

  return { mode: 'set', values };
};

const readAccessState = (): CourseAccessState => {
  if (typeof window === 'undefined') {
    return { mode: 'all' };
  }

  try {
    const raw = window.localStorage.getItem(COURSE_ACCESS_STORAGE_KEY);
    return parseCourseAccessValue(raw);
  } catch (error) {
    console.warn('[course-access] Failed to read course access configuration.', error);
    return { mode: 'all' };
  }
};

export const hasCourseAccess = (courseId: string): boolean => {
  if (!courseId) {
    return true;
  }

  if (isAdminAuthenticated()) {
    return true;
  }

  const normalisedId = normaliseCourseId(courseId);
  if (!normalisedId) {
    return true;
  }

  const accessState = readAccessState();

  if (accessState.mode === 'all') {
    return true;
  }

  return accessState.values.has(normalisedId);
};

type AccessChangeListener = () => void;

export const subscribeCourseAccessChanges = (listener: AccessChangeListener) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let frameId: number | null = null;

  const notify = () => {
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
    }
    frameId = window.requestAnimationFrame(() => {
      listener();
      frameId = null;
    });
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === COURSE_ACCESS_STORAGE_KEY) {
      notify();
    }
  };

  const handleFocus = () => {
    notify();
  };

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      notify();
    }
  };

  const handleCustomEvent = () => {
    notify();
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener(COURSE_ACCESS_CHANGE_EVENT, handleCustomEvent);

  return () => {
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
    }
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener(COURSE_ACCESS_CHANGE_EVENT, handleCustomEvent);
  };
};

export const emitCourseAccessChange = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(COURSE_ACCESS_CHANGE_EVENT));
};
