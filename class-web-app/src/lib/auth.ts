export type ClassAccessRecord = {
  classId: number;
  className: string;
};

type AuthResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

const STORAGE_KEY = 'elliesbang:student-access';

const normaliseClassAccessData = (input: unknown): ClassAccessRecord[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const { classId, className } = item as { classId?: unknown; className?: unknown };
      const parsedId = Number(classId);
      const parsedName = typeof className === 'string' ? className.trim() : '';

      if (Number.isNaN(parsedId) || parsedName.length === 0) {
        return null;
      }

      return { classId: parsedId, className: parsedName } satisfies ClassAccessRecord;
    })
    .filter((record): record is ClassAccessRecord => record !== null);
};

export const authenticateStudent = async (payload: { name: string; email: string }): Promise<ClassAccessRecord[]> => {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as AuthResponse;

  if (!response.ok || data.success === false) {
    throw new Error(data.message || '수강생 인증에 실패했습니다.');
  }

  const records = normaliseClassAccessData(data.data);
  if (records.length === 0) {
    throw new Error(data.message || '등록된 수강 내역이 없습니다.');
  }

  return records;
};

export const saveStudentAccess = (records: ClassAccessRecord[]) => {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('학생 접근 정보를 저장하지 못했습니다.', error);
  }
};

export const getStoredStudentAccess = (): ClassAccessRecord[] => {
  try {
    if (typeof window === 'undefined') {
      return [];
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return normaliseClassAccessData(parsed);
  } catch (error) {
    console.error('저장된 학생 접근 정보를 불러오지 못했습니다.', error);
    return [];
  }
};

export const clearStudentAccess = () => {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('학생 접근 정보를 초기화하지 못했습니다.', error);
  }
};
