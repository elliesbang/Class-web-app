export type AssignmentUploadTimeOption = 'all_day' | 'same_day';

export type ClassInfo = {
  id: number;
  name: string;
  code: string;
  category: string;
  startDate: string | null;
  endDate: string | null;
  assignmentUploadTime: AssignmentUploadTimeOption;
  assignmentUploadDays: string[];
  deliveryMethods: string[];
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ClassFormPayload = {
  name: string;
  code: string;
  category: string;
  startDate: string | null;
  endDate: string | null;
  assignmentUploadTime: AssignmentUploadTimeOption;
  assignmentUploadDays: string[];
  deliveryMethods: string[];
  isActive: boolean;
};

export type Category = {
  id: number;
  name: string;
};

export type VideoPayload = {
  id: number;
  title: string;
  url: string;
  description?: string | null;
  classId: number;
  createdAt: string;
};

export type MaterialPayload = {
  id: number;
  title: string;
  fileUrl: string;
  description?: string | null;
  classId: number;
  createdAt: string;
};

export type NoticePayload = {
  id: number;
  title: string;
  content: string;
  author?: string | null;
  classId: number;
  createdAt: string;
};

export type FeedbackPayload = {
  id: number;
  userName: string;
  comment: string;
  classId: number;
  createdAt: string;
};

export type AssignmentStatus = '미제출' | '제출됨' | '피드백 완료';
export type AssignmentFileType = 'image' | 'pdf' | 'link' | 'other';

export type AssignmentListItem = {
  id: number;
  title: string;
  classId: number;
  className: string | null;
  studentName: string;
  studentEmail: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: AssignmentFileType;
  link: string | null;
  status: AssignmentStatus;
  submittedAt: string;
  createdAt: string;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  classes?: ClassInfo[];
  categories?: Category[];
  videos?: Array<{
    id: number;
    title: string;
    url: string;
    description?: string | null;
    classId: number;
    createdAt: string;
  }>;
  video?: {
    id: number;
    title: string;
    url: string;
    description?: string | null;
    classId: number;
    createdAt: string;
  };
  materials?: Array<{
    id: number;
    title: string;
    fileUrl: string;
    description?: string | null;
    classId: number;
    createdAt: string;
  }>;
  material?: {
    id: number;
    title: string;
    fileUrl: string;
    description?: string | null;
    classId: number;
    createdAt: string;
  };
  notices?: Array<{
    id: number;
    title: string;
    content: string;
    author?: string | null;
    classId: number;
    createdAt: string;
  }>;
  notice?: {
    id: number;
    title: string;
    content: string;
    author?: string | null;
    classId: number;
    createdAt: string;
  };
  feedback?: Array<{
    id: number;
    userName: string;
    comment: string;
    classId: number;
    createdAt: string;
  }> | {
    id: number;
    userName: string;
    comment: string;
    classId: number;
    createdAt: string;
  };
  assignments?: AssignmentListItem[];
  assignment?: AssignmentListItem;
};

const assertResponse = async (response: Response) => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || '요청 처리 중 오류가 발생했습니다.');
  }
};

const parseDateValue = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  return null;
};

const parseAssignmentUploadTime = (value: unknown): AssignmentUploadTimeOption => {
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (normalised === 'same_day' || normalised === 'day_only' || normalised === 'single_day') {
      return 'same_day';
    }
  }

  if (value === 'same_day') {
    return 'same_day';
  }

  return 'all_day';
};

const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim();
        }
        if (item == null) {
          return '';
        }
        return String(item).trim();
      })
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parseStringArray(parsed);
      }
    } catch (error) {
      // ignore JSON parse errors and fallback to comma separated values
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
};

const normaliseCategoryRecord = (input: unknown): Category | null => {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const candidate = input as Record<string, unknown>;
  const id = Number(candidate.id ?? candidate.category_id ?? candidate.categoryId);
  const rawName = candidate.name ?? candidate.category_name ?? candidate.categoryName;
  const name = typeof rawName === 'string' ? rawName.trim() : rawName != null ? String(rawName).trim() : '';

  if (Number.isNaN(id) || id <= 0 || name.length === 0) {
    return null;
  }

  return { id, name } satisfies Category;
};

const normaliseCategoryList = (input: unknown): Category[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => normaliseCategoryRecord(item))
    .filter((value): value is Category => value !== null)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko', { sensitivity: 'base' }));
};

const toNormalisedCategoryList = (input: unknown): Category[] => {
  if (Array.isArray(input)) {
    return normaliseCategoryList(input);
  }

  if (input && typeof input === 'object') {
    const values = Object.values(input).flatMap((value) =>
      Array.isArray(value) ? normaliseCategoryList(value) : [],
    );
    if (values.length > 0) {
      return values;
    }
    const record = normaliseCategoryRecord(input);
    return record ? [record] : [];
  }

  return [];
};

const parseBooleanValue = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    return normalised === '1' || normalised === 'true' || normalised === 'y' || normalised === 'yes' || normalised === 'on';
  }

  return false;
};

const normaliseClassRecord = (item: unknown): ClassInfo | null => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const id = Number(candidate.id ?? candidate.class_id);
  const rawName = candidate.name ?? candidate.class_name;
  const name = typeof rawName === 'string' ? rawName.trim() : rawName != null ? String(rawName).trim() : '';

  if (Number.isNaN(id) || name.length === 0) {
    return null;
  }

  const rawCode = candidate.code ?? candidate.class_code;
  const code = typeof rawCode === 'string' ? rawCode.trim() : rawCode != null ? String(rawCode).trim() : '';

  const rawCategory = candidate.category ?? candidate.class_category;
  const category = typeof rawCategory === 'string'
    ? rawCategory.trim()
    : rawCategory != null
    ? String(rawCategory).trim()
    : '';

  const startDate = parseDateValue(candidate.start_date ?? candidate.startDate);
  const endDate = parseDateValue(candidate.end_date ?? candidate.endDate);
  const assignmentUploadTime = parseAssignmentUploadTime(
    candidate.assignment_upload_time ??
      candidate.assignmentUploadTime ??
      candidate.assignmentSubmissionTime ??
      candidate.assignment_submission_time,
  );
  const assignmentUploadDays = parseStringArray(
    candidate.assignment_upload_days ??
      candidate.assignmentUploadDays ??
      candidate.assignmentSubmissionDays ??
      candidate.assignment_submission_days,
  );
  const deliveryMethods = parseStringArray(candidate.delivery_methods ?? candidate.deliveryMethods);
  const isActive = parseBooleanValue(candidate.is_active ?? candidate.isActive);

  const createdAt = parseDateValue(candidate.created_at ?? candidate.createdAt);
  const updatedAt = parseDateValue(candidate.updated_at ?? candidate.updatedAt);

  return {
    id,
    name,
    code,
    category,
    startDate,
    endDate,
    assignmentUploadTime,
    assignmentUploadDays,
    deliveryMethods,
    isActive,
    createdAt,
    updatedAt,
  } satisfies ClassInfo;
};

const normaliseClassList = (input: unknown): ClassInfo[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => normaliseClassRecord(item))
    .filter((value): value is ClassInfo => value !== null);
};

const toNormalisedClassList = (input: unknown): ClassInfo[] => {
  if (Array.isArray(input)) {
    return normaliseClassList(input);
  }

  if (input && typeof input === 'object') {
    return normaliseClassList([input]);
  }

  return [];
};

export const getClasses = async (): Promise<ClassInfo[]> => {
  const response = await fetch('/api/classes');
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<ClassInfo[]>;

  if (data.success === false) {
    throw new Error(data.message || '수업 목록을 불러오지 못했습니다.');
  }

  const fromData = normaliseClassList(data.data);
  if (fromData.length > 0) {
    return fromData;
  }

  const fromLegacy = normaliseClassList((data as { classes?: unknown }).classes);
  if (fromLegacy.length > 0) {
    return fromLegacy;
  }

  return [];
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await fetch('/api/categories');
  await assertResponse(response);

  const payload = await response.json();

  const fromData = toNormalisedCategoryList(payload);
  if (fromData.length > 0) {
    return fromData;
  }

  if (payload && typeof payload === 'object') {
    const candidates =
      'data' in payload
        ? toNormalisedCategoryList((payload as { data?: unknown }).data)
        : 'categories' in payload
        ? toNormalisedCategoryList((payload as { categories?: unknown }).categories)
        : [];
    if (candidates.length > 0) {
      return candidates;
    }
  }

  return [];
};

const serialiseClassPayload = (payload: ClassFormPayload) => ({
  name: payload.name,
  code: payload.code,
  category: payload.category,
  startDate: payload.startDate,
  endDate: payload.endDate,
  assignmentUploadTime: payload.assignmentUploadTime,
  assignmentUploadDays: payload.assignmentUploadDays,
  deliveryMethods: payload.deliveryMethods,
  isActive: payload.isActive,
});

export const createClass = async (payload: ClassFormPayload): Promise<ClassInfo> => {
  const response = await fetch('/api/classes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(serialiseClassPayload(payload)),
  });
  await assertResponse(response);

  const data = (await response.json()) as ApiResponse<ClassInfo | ClassInfo[]>;

  if (data.success === false) {
    throw new Error(data.message || '수업을 등록하지 못했습니다.');
  }

  const normalised = toNormalisedClassList(data.data);
  if (normalised.length > 0) {
    return normalised[0];
  }

  const fallback = toNormalisedClassList((data as { classes?: unknown }).classes);
  if (fallback.length > 0) {
    return fallback[0];
  }

  throw new Error('생성된 수업 정보를 확인할 수 없습니다.');
};

export const updateClass = async (id: number, payload: ClassFormPayload): Promise<ClassInfo> => {
  const response = await fetch(`/api/classes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(serialiseClassPayload(payload)),
  });
  await assertResponse(response);

  const data = (await response.json()) as ApiResponse<ClassInfo | ClassInfo[]>;

  if (data.success === false) {
    throw new Error(data.message || '수업 정보를 수정하지 못했습니다.');
  }

  const normalised = toNormalisedClassList(data.data);
  if (normalised.length > 0) {
    return normalised[0];
  }

  const fallback = toNormalisedClassList((data as { classes?: unknown }).classes);
  if (fallback.length > 0) {
    return fallback[0];
  }

  throw new Error('수정된 수업 정보를 확인할 수 없습니다.');
};

export const deleteClass = async (id: number): Promise<void> => {
  const response = await fetch(`/api/classes/${id}`, {
    method: 'DELETE',
  });
  await assertResponse(response);
};

export const getVideos = async () => {
  const response = await fetch('/api/videos');
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  return data.videos ?? [];
};

export const createVideo = async (payload: { title: string; url: string; description?: string; classId: number }) => {
  const response = await fetch('/api/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  if (!data.video || Array.isArray(data.video)) {
    throw new Error('영상 정보를 확인할 수 없습니다.');
  }
  return data.video;
};

export const getMaterials = async () => {
  const response = await fetch('/api/materials');
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  return data.materials ?? [];
};

export const createMaterial = async (payload: { title: string; fileUrl: string; description?: string; classId: number }) => {
  const response = await fetch('/api/materials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  if (!data.material || Array.isArray(data.material)) {
    throw new Error('자료 정보를 확인할 수 없습니다.');
  }
  return data.material;
};

export const getNotices = async (params: { classId?: number } = {}) => {
  const searchParams = new URLSearchParams();
  if (typeof params.classId === 'number') {
    searchParams.set('classId', String(params.classId));
  }

  const query = searchParams.toString();
  const response = await fetch(`/api/notices${query ? `?${query}` : ''}`);
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  return data.notices ?? [];
};

export const createNotice = async (payload: { title: string; content: string; classId: number; author?: string }) => {
  const response = await fetch('/api/notices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: payload.title,
      content: payload.content,
      author: payload.author,
      class_id: payload.classId,
    }),
  });
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  if (!data.notice || Array.isArray(data.notice)) {
    throw new Error('공지 정보를 확인할 수 없습니다.');
  }
  return data.notice;
};

export const createFeedback = async (payload: { userName: string; comment: string; classId: number }) => {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  if (!data.feedback || Array.isArray(data.feedback)) {
    throw new Error('피드백 정보를 확인할 수 없습니다.');
  }
  return data.feedback;
};

export const getAssignments = async (params: { classId?: number; limit?: number } = {}) => {
  const searchParams = new URLSearchParams();
  if (typeof params.classId === 'number') {
    searchParams.set('classId', String(params.classId));
  }
  if (typeof params.limit === 'number') {
    searchParams.set('limit', String(params.limit));
  }

  const query = searchParams.toString();
  const response = await fetch(`/api/assignments${query ? `?${query}` : ''}`);
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  return (data.assignments ?? []) as AssignmentListItem[];
};

export const createAssignmentSubmission = async (payload: {
  title?: string;
  classId: number;
  studentName?: string;
  studentEmail?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: AssignmentFileType;
  link?: string | null;
  status?: AssignmentStatus;
  submittedAt?: string | null;
}) => {
  const response = await fetch('/api/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  if (!data.assignment || Array.isArray(data.assignment)) {
    throw new Error('과제 정보를 확인할 수 없습니다.');
  }
  return data.assignment as AssignmentListItem;
};
