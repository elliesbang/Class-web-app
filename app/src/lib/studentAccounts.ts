export type FetchStudentsOptions = {
  signal?: AbortSignal;
};

export type StudentAccountRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  courseName: string;
  registeredAt: string;
};

export type VodAccountRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  vodAccess: string;
  subscriptionEndsAt: string;
};

const generateId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `student-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normaliseString = (value: unknown, fallback = '') => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (value == null) {
    return fallback;
  }
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
};

const extractDataArray = (payload: unknown) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: unknown[] }).data;
  }
  return [];
};

const fetchRows = async (endpoint: string, signal?: AbortSignal) => {
  const response = await fetch(endpoint, { signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch students from ${endpoint}`);
  }
  const payload = await response.json().catch(() => []);
  return extractDataArray(payload);
};

const mapStudentRow = (row: Record<string, unknown>): StudentAccountRow => ({
  id: normaliseString(row.id || row.ID || generateId()),
  name: normaliseString(row.name || row.이름 || '이름 미확인'),
  email: normaliseString(row.email || row.이메일 || ''),
  status: normaliseString(row.status || row.상태 || '상태 미정'),
  courseName: normaliseString(row.courseName || row.course || row.class || '미지정'),
  registeredAt: normaliseString(row.registeredAt || row.joinedAt || row.등록일 || row.가입일 || ''),
});

const mapVodRow = (row: Record<string, unknown>): VodAccountRow => ({
  id: normaliseString(row.id || row.ID || generateId()),
  name: normaliseString(row.name || row.이름 || '이름 미확인'),
  email: normaliseString(row.email || row.이메일 || ''),
  status: normaliseString(row.status || row.상태 || '상태 미정'),
  vodAccess: normaliseString(row.vodAccess || row.access || '권한 미확인'),
  subscriptionEndsAt: normaliseString(row.subscriptionEndsAt || row.endsAt || row.만료일 || ''),
});

export const getStudents = async ({ signal }: FetchStudentsOptions = {}): Promise<StudentAccountRow[]> => {
  const rows = await fetchRows('/.netlify/functions/students', signal);
  return rows.map((row) => mapStudentRow(row as Record<string, unknown>));
};

export const getVodStudents = async ({ signal }: FetchStudentsOptions = {}): Promise<VodAccountRow[]> => {
  const rows = await fetchRows('/.netlify/functions/students/vod', signal);
  return rows.map((row) => mapVodRow(row as Record<string, unknown>));
};
