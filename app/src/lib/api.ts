import { type ApiFetchOptions } from '../api/client';
import { getStoredAuthUser } from './authUser';
import type {
  ClassroomMaterialRecord,
  ClassroomNoticeRecord,
  ClassroomVideoRecord,
  GlobalNoticeRecord,
  VodVideoRecord,
} from './contentLibrary';

export type AssignmentUploadTimeOption = 'all_day' | 'same_day';

export type ClassInfo = {
  id: number;
  name: string;
  code: string;
  category: string;
  categoryId: number | null;
  startDate: string | null;
  endDate: string | null;
  duration: string;
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
  categoryId?: number | null;
  startDate: string | null;
  endDate: string | null;
  duration?: string | null;
  assignmentUploadTime: AssignmentUploadTimeOption;
  assignmentUploadDays: string[];
  deliveryMethods: string[];
  isActive: boolean;
};

export type ClassMutationResult = {
  success: boolean;
  message?: string | null;
  classInfo?: ClassInfo | null;
};

export type VideoPayload = ClassroomVideoRecord;
export type MaterialPayload = ClassroomMaterialRecord;
export type NoticePayload = ClassroomNoticeRecord;
export type GlobalNoticePayload = GlobalNoticeRecord;
export type VodContentPayload = VodVideoRecord;

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
  classId: number | null;
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
  videos?: VideoPayload[];
  video?: VideoPayload;
  materials?: MaterialPayload[];
  material?: MaterialPayload;
  notices?: NoticePayload[];
  notice?: NoticePayload;
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

type CategoryRecord = { id: number; name: string; parent_id: number | null };

export async function fetchCategories(options: ApiFetchOptions = {}): Promise<CategoryRecord[]> {
  const { signal } = options;
  const token = getStoredAuthUser()?.token ?? '';
  const response = await fetch('/api/class-category', {
    signal,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('카테고리를 불러오지 못했습니다.');
  }

  const payload = await response.json();
  const raw = Array.isArray(payload) ? payload : [];

  return raw
    .map((item) => item as Partial<CategoryRecord>)
    .filter(
      (item): item is CategoryRecord =>
        item != null && typeof item.id !== 'undefined' && typeof item.name === 'string',
    )
    .map((item) => ({
      id: Number(item.id),
      name: String(item.name),
      parent_id: item.parent_id == null ? null : Number(item.parent_id),
    }));
}

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

const parseNumericValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const normaliseClassRecord = (item: unknown): ClassInfo | null => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const id = Number(candidate.id ?? candidate.class_id);
  const rawName = candidate.name ?? candidate.class_name ?? candidate.title ?? candidate.classTitle;
  const name = typeof rawName === 'string' ? rawName.trim() : rawName != null ? String(rawName).trim() : '';

  if (Number.isNaN(id) || name.length === 0) {
    return null;
  }

  const rawCode = candidate.code ?? candidate.class_code;
  const code = typeof rawCode === 'string' ? rawCode.trim() : rawCode != null ? String(rawCode).trim() : '';

  const rawCategory =
    candidate.category ??
    candidate.class_category ??
    candidate.category_name ??
    candidate.categoryName;
  const category = typeof rawCategory === 'string'
    ? rawCategory.trim()
    : rawCategory != null
    ? String(rawCategory).trim()
    : '';
  const categoryId = parseNumericValue(candidate.category_id ?? candidate.categoryId);

  const startDate = parseDateValue(candidate.start_date ?? candidate.startDate);
  const endDate = parseDateValue(candidate.end_date ?? candidate.endDate);
  const rawDuration =
    candidate.duration ?? candidate.class_duration ?? candidate.classDuration ?? candidate.class_time ?? candidate.classTime;
  const duration =
    typeof rawDuration === 'string'
      ? rawDuration.trim()
      : rawDuration != null
      ? String(rawDuration).trim()
      : '';
  const assignmentUploadTime = parseAssignmentUploadTime(
    candidate.assignment_upload_time ??
    candidate.assignmentUploadTime ??
      candidate.assignmentSubmissionTime ??
      candidate.assignment_submission_time ??
      candidate.upload_limit ??
      candidate.uploadLimit,
  );
  const assignmentUploadDays = parseStringArray(
    candidate.assignment_upload_days ??
      candidate.assignmentUploadDays ??
      candidate.assignmentSubmissionDays ??
      candidate.assignment_submission_days ??
      candidate.upload_day ??
      candidate.uploadDay,
  );
  const deliveryMethods = parseStringArray(
    candidate.delivery_methods ??
      candidate.deliveryMethods ??
      candidate.delivery_method ??
      candidate.deliveryMethod,
  );
  const isActive = parseBooleanValue(
    candidate.is_active ?? candidate.isActive ?? candidate.active ?? candidate.status,
  );

  const createdAt = parseDateValue(candidate.created_at ?? candidate.createdAt);
  const updatedAt = parseDateValue(candidate.updated_at ?? candidate.updatedAt);

  return {
    id,
    name,
    code,
    category,
    categoryId: categoryId ?? null,
    startDate,
    endDate,
    duration,
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
  return [];

  // try {
  //   const payload = await apiFetch('/api/classes');
  //   ...
  // }
};

const serialiseClassPayload = (payload: ClassFormPayload) => ({
  name: payload.name,
  code: payload.code,
  category: payload.category,
  categoryId: payload.categoryId ?? null,
  startDate: payload.startDate,
  endDate: payload.endDate,
  duration: payload.duration?.trim() ?? '',
  assignmentUploadTime: payload.assignmentUploadTime,
  assignmentUploadDays: payload.assignmentUploadDays,
  deliveryMethods: payload.deliveryMethods,
  isActive: payload.isActive,
});

const toClassMutationResult = (
  response: ApiResponse<ClassInfo | ClassInfo[] | ClassInfo> | null,
  failureMessage: string,
  missingRecordMessage: string,
): ClassMutationResult => {
  if (!response || typeof response !== 'object') {
    return { success: false, message: failureMessage };
  }

  if (response.success === false) {
    return { success: false, message: response.message ?? failureMessage };
  }

  const normalised = toNormalisedClassList(
    (response as { data?: unknown }).data ?? (response as { class?: unknown }).class ?? (response as { classes?: unknown }).classes,
  );

  if (normalised.length > 0) {
    return { success: true, classInfo: normalised[0], message: response.message ?? null };
  }

  return { success: false, message: missingRecordMessage };
};

export const createClass = async (payload: ClassFormPayload): Promise<ClassMutationResult> => {
  const token = getStoredAuthUser()?.token ?? '';
  const response = await fetch('/api/classes/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
};

export const updateClass = async (id: string, payload: ClassFormPayload): Promise<ClassMutationResult> => {
  const token = getStoredAuthUser()?.token ?? '';
  const response = await fetch(`/api/classes/${id}/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return response.json();
};

export const deleteClass = async (id: number): Promise<ClassMutationResult> => {
  void id;
  return { success: false, message: '데이터 연동이 비활성화되었습니다.', classInfo: null };

  // const data = await apiFetch(`/api/classes/remove?id=${id}`, { method: 'DELETE' });
};

export const getVideos = async (params: { classId?: number } = {}) => {
  void params;
  return [] as VideoPayload[];

  // const data = await apiFetch(`/api/videos${query ? `?${query}` : ''}`);
  // return data.videos ?? [];
};

export const createVideo = async (payload: {
  title: string;
  url: string;
  description?: string | null;
  classId: number;
}) => {
  void payload;
  return null;

  // const data = await apiFetch('/api/videos', { method: 'POST', body: JSON.stringify(payload) });
  // return data.video;
};

export const reorderVideos = async (payload: { classId: number; orderedIds: number[] }) => {
  void payload;
  return [] as VideoPayload[];

  // const data = await apiFetch('/api/videos/order', { method: 'PUT', body: JSON.stringify(payload) });
  // return data.videos ?? [];
};

export const deleteVideo = async (id: number) => {
  void id;
  // await apiFetch(`/api/videos/${id}`, { method: 'DELETE', skipJsonParse: true });
};

export const getMaterials = async () => {
  return [] as MaterialPayload[];

  // const data = await apiFetch('/api/materials');
  // return data.materials ?? [];
};

export const createMaterial = async (payload: {
  title: string;
  fileUrl: string;
  description?: string | null;
  classId: number;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
}) => {
  void payload;
  return null;

  // const data = await apiFetch('/api/materials', { method: 'POST', body: JSON.stringify(payload) });
  // return data.material;
};

export const deleteMaterial = async (id: number) => {
  void id;
  // await apiFetch(`/api/materials/${id}`, { method: 'DELETE', skipJsonParse: true });
};

export const getNotices = async (params: { classId?: number } = {}) => {
  void params;
  return [] as NoticePayload[];

  // const data = await apiFetch(`/api/notices${query ? `?${query}` : ''}`);
  // return data.notices ?? [];
};

export const createNotice = async (payload: { title: string; content: string; classId: number; author?: string }) => {
  void payload;
  return null;

  // const data = await apiFetch('/api/notices', { method: 'POST', body: JSON.stringify({...}) });
  // return data.notice;
};

export const deleteNotice = async (id: number) => {
  void id;
  // await apiFetch(`/api/notices/${id}`, { method: 'DELETE', skipJsonParse: true });
};

export const createFeedback = async (payload: { userName: string; comment: string; classId: number }) => {
  void payload;
  return null;

  // const data = await apiFetch('/api/feedback', { method: 'POST', body: JSON.stringify(payload) });
  // return data.feedback;
};

export const getAssignments = async (params: { classId?: number; limit?: number } = {}) => {
  void params;
  return [] as AssignmentListItem[];

  // const data = await apiFetch(`/api/assignments${query ? `?${query}` : ''}`);
  // return (data.assignments ?? []) as AssignmentListItem[];
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
  void payload;
  return null;

  // const data = await apiFetch('/api/assignments', { method: 'POST', body: JSON.stringify(payload) });
  // return data.assignment as AssignmentListItem;
};
