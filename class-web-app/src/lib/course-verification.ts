const STORAGE_KEY = 'ellieVerifiedCourseCodes';

type VerifiedCourseMap = Record<string, string>;

const isBrowser = typeof window !== 'undefined';

const readStorage = (): VerifiedCourseMap => {
  if (!isBrowser) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return Object.entries(parsed).reduce<VerifiedCourseMap>((acc, [key, value]) => {
      if (typeof value === 'string') {
        acc[key] = value;
      }
      return acc;
    }, {});
  } catch (error) {
    console.warn('[course-verification] Failed to read verified codes from storage.', error);
    return {};
  }
};

const writeStorage = (data: VerifiedCourseMap) => {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('[course-verification] Failed to write verified codes to storage.', error);
  }
};

export const getVerifiedCode = (courseId: string): string | null => {
  if (!courseId) {
    return null;
  }

  const map = readStorage();
  return map[courseId] ?? null;
};

export const setVerifiedCode = (courseId: string, code: string) => {
  if (!courseId) {
    return;
  }

  const trimmedCode = code.trim();
  if (!trimmedCode) {
    return;
  }

  const map = readStorage();
  map[courseId] = trimmedCode;
  writeStorage(map);
};

type VerificationResponse = {
  ok: boolean;
  courseId?: string;
  message?: string;
};

const extractBooleanFlag = (payload: Record<string, unknown>, keys: string[]): boolean | undefined => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      const value = payload[key];
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') {
          return true;
        }
        if (value.toLowerCase() === 'false') {
          return false;
        }
      }
    }
  }
  return undefined;
};

export const verifyCourseCode = async (courseId: string, code: string): Promise<VerificationResponse> => {
  if (!courseId) {
    return { ok: false, message: '유효하지 않은 강의입니다.' };
  }

  const trimmedCode = code.trim();
  if (!trimmedCode) {
    return { ok: false, message: '수강 코드를 입력해주세요.' };
  }

  try {
    const response = await fetch('/api/courses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courseId, code: trimmedCode }),
    });

    if (!response.ok) {
      return { ok: false, message: '유효하지 않은 코드입니다.' };
    }

    let data: unknown = null;
    try {
      data = await response.json();
    } catch (error) {
      // ignore JSON parse errors and treat as empty payload
    }

    if (data && typeof data === 'object') {
      const payload = data as Record<string, unknown>;
      const booleanFlag = extractBooleanFlag(payload, ['valid', 'success', 'matched', 'ok', 'isValid']);
      const resolvedCourseId = typeof payload.courseId === 'string' && payload.courseId.trim().length > 0
        ? payload.courseId.trim()
        : courseId;

      if (booleanFlag === false) {
        return { ok: false, courseId: resolvedCourseId, message: '유효하지 않은 코드입니다.' };
      }

      if (booleanFlag === true) {
        if (resolvedCourseId !== courseId) {
          return { ok: false, message: '유효하지 않은 코드입니다.' };
        }
        return { ok: true, courseId: resolvedCourseId };
      }

      // If API does not return an explicit boolean but responds with 200, treat as success when courseId matches
      if (resolvedCourseId === courseId) {
        return { ok: true, courseId: resolvedCourseId };
      }

      return { ok: false, message: '유효하지 않은 코드입니다.' };
    }

    return { ok: true, courseId };
  } catch (error) {
    console.warn('[course-verification] Failed to verify course code.', error);
    return { ok: false, message: '유효하지 않은 코드입니다.' };
  }
};

export const clearVerifiedCode = (courseId: string) => {
  if (!courseId) {
    return;
  }

  const map = readStorage();
  if (map[courseId]) {
    delete map[courseId];
    writeStorage(map);
  }
};

export const STORAGE_KEY_VERIFIED_COURSES = STORAGE_KEY;
