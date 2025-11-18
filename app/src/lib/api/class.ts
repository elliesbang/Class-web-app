import { apiFetch } from './apiClient';

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

const normaliseClass = (input: unknown): ClassInfo | null => {
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;
  const id = Number(record.id ?? record.class_id);
  const name = (record.name ?? record.class_name ?? '') as string;
  if (!Number.isFinite(id) || !name) return null;
  return {
    id,
    name,
    code: (record.code as string | undefined) ?? '',
    category: (record.category as string | undefined) ?? (record.category_name as string | undefined) ?? '',
    categoryId: record.categoryId == null ? null : Number(record.categoryId ?? record.category_id),
    startDate: (record.startDate as string | undefined) ?? (record.start_date as string | undefined) ?? null,
    endDate: (record.endDate as string | undefined) ?? (record.end_date as string | undefined) ?? null,
    duration: (record.duration as string | undefined) ?? '',
    assignmentUploadTime: (record.assignmentUploadTime as AssignmentUploadTimeOption | undefined) ?? 'all_day',
    assignmentUploadDays: Array.isArray(record.assignmentUploadDays)
      ? (record.assignmentUploadDays as string[])
      : Array.isArray(record.assignment_upload_days)
        ? (record.assignment_upload_days as string[])
        : [],
    deliveryMethods: Array.isArray(record.deliveryMethods)
      ? (record.deliveryMethods as string[])
      : Array.isArray(record.delivery_methods)
        ? (record.delivery_methods as string[])
        : [],
    isActive: Boolean(record.isActive ?? record.active ?? record.status ?? true),
    createdAt: (record.createdAt as string | undefined) ?? (record.created_at as string | undefined) ?? null,
    updatedAt: (record.updatedAt as string | undefined) ?? (record.updated_at as string | undefined) ?? null,
  };
};

const normaliseClassList = (payload: unknown): ClassInfo[] => {
  if (Array.isArray(payload)) {
    return payload.map(normaliseClass).filter((item): item is ClassInfo => item != null);
  }
  if (payload && typeof payload === 'object') {
    const source = payload as { classes?: unknown[]; results?: unknown[]; data?: unknown[] };
    const list =
      Array.isArray(source.classes) || Array.isArray(source.results) || Array.isArray(source.data)
        ? ((source.classes ?? source.results ?? source.data) as unknown[])
        : [];
    return list.map(normaliseClass).filter((item): item is ClassInfo => item != null);
  }
  return [];
};

export const getClasses = async (): Promise<ClassInfo[]> => {
  const data = await apiFetch<unknown>('/classes');
  return normaliseClassList(data);
};

const toMutationResult = (payload: unknown, fallbackMessage: string): ClassMutationResult => {
  const classes = normaliseClassList(payload);
  if (classes.length > 0) {
    return { success: true, classInfo: classes[0], message: (payload as { message?: string })?.message ?? null };
  }
  return { success: true, classInfo: null, message: (payload as { message?: string })?.message ?? fallbackMessage };
};

export const createClass = async (payload: ClassFormPayload): Promise<ClassMutationResult> => {
  const data = await apiFetch<unknown>('/classes', { method: 'POST', body: JSON.stringify(payload) });
  return toMutationResult(data, '수업 정보를 불러오지 못했습니다.');
};

export const updateClass = async (id: string | number, payload: ClassFormPayload): Promise<ClassMutationResult> => {
  const data = await apiFetch<unknown>(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  return toMutationResult(data, '수업 정보를 불러오지 못했습니다.');
};

export const deleteClass = async (id: string | number): Promise<ClassMutationResult> => {
  await apiFetch(`/classes/${id}`, { method: 'DELETE', skipJsonParse: true });
  return { success: true, classInfo: null, message: '수업이 삭제되었습니다.' };
};
