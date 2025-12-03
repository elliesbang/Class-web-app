import { supabase } from '@/lib/supabaseClient';

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

const normaliseClass = (record: Record<string, any> | null): ClassInfo | null => {
  if (!record) return null;

  return {
    id: Number(record.id),
    name: record.name ?? '',
    code: record.code ?? '',
    category: record.category ?? '',
    categoryId: record.category_id == null ? null : Number(record.category_id),
    startDate: record.start_date ?? null,
    endDate: record.end_date ?? null,
    duration: record.duration ?? '',
    assignmentUploadTime: record.assignment_upload_time ?? 'all_day',
    assignmentUploadDays: Array.isArray(record.assignment_upload_days) ? record.assignment_upload_days : [],
    deliveryMethods: Array.isArray(record.delivery_methods) ? record.delivery_methods : [],
    isActive: Boolean(record.is_active ?? record.active ?? true),
    createdAt: record.created_at ?? null,
    updatedAt: record.updated_at ?? null,
  };
};

const toMutationResult = (data: Record<string, any>[] | null, fallbackMessage: string): ClassMutationResult => {
  const classInfo = normaliseClass(data?.[0] ?? null);
  return {
    success: data ? data.length > 0 : false,
    classInfo: classInfo ?? null,
    message: classInfo ? null : fallbackMessage,
  };
};

/* -------------------------------------------------------
 * ① READ – Cloudflare Functions에서 수업 목록을 불러옴
 * -----------------------------------------------------*/
export const getClasses = async (): Promise<ClassInfo[]> => {
  const token = localStorage.getItem('supabase_token');

  const res = await fetch('/api/classes-list', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
  });

  if (!res.ok) {
    console.error('[getClasses] API error:', res.status);
    return [];
  }

  const json = await res.json();
  const records = json.classes ?? json.data ?? [];

  return records
    .map((item: Record<string, any>) => normaliseClass(item))
    .filter((i): i is ClassInfo => i != null);
};

/* -------------------------------------------------------
 * ② CREATE – Supabase (anon이 아닌 DB RPC가 아님, insert 가능)
 * -----------------------------------------------------*/
export const createClass = async (payload: ClassFormPayload): Promise<ClassMutationResult> => {
  const { data, error } = await supabase
    .from('classes')
    .insert({
      name: payload.name,
      code: payload.code,
      category_id: payload.categoryId ?? null,
      start_date: payload.startDate,
      end_date: payload.endDate,
      duration: payload.duration ?? '',
      assignment_upload_time: payload.assignmentUploadTime,
      assignment_upload_days: payload.assignmentUploadDays,
      delivery_methods: payload.deliveryMethods,
      is_active: payload.isActive,
      category: payload.category,
    })
    .select();

  if (error) {
    return { success: false, message: error.message, classInfo: null };
  }

  return toMutationResult(data, '수업 정보를 불러오지 못했습니다.');
};

/* -------------------------------------------------------
 * ③ UPDATE
 * -----------------------------------------------------*/
export const updateClass = async (id: string | number, payload: ClassFormPayload): Promise<ClassMutationResult> => {
  const { data, error } = await supabase
    .from('classes')
    .update({
      name: payload.name,
      code: payload.code,
      category_id: payload.categoryId ?? null,
      start_date: payload.startDate,
      end_date: payload.endDate,
      duration: payload.duration ?? '',
      assignment_upload_time: payload.assignmentUploadTime,
      assignment_upload_days: payload.assignmentUploadDays,
      delivery_methods: payload.deliveryMethods,
      is_active: payload.isActive,
      category: payload.category,
    })
    .eq('id', id)
    .select();

  if (error) {
    return { success: false, message: error.message, classInfo: null };
  }

  return toMutationResult(data, '수업 정보를 불러오지 못했습니다.');
};

/* -------------------------------------------------------
 * ④ DELETE
 * -----------------------------------------------------*/
export const deleteClass = async (id: string | number): Promise<ClassMutationResult> => {
  const { error } = await supabase.from('classes').delete().eq('id', id);

  if (error) {
    return { success: false, message: error.message, classInfo: null };
  }

  return { success: true, classInfo: null, message: '수업이 삭제되었습니다.' };
};
