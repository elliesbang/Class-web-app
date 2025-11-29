import { supabase } from '@/lib/supabaseClient';

export type ClassroomVideo = {
  id: number | string;
  classroomId: number | string;
  title: string;
  url: string;
  description?: string | null;
  orderNum: number;
  createdAt: string;
};

export type ClassroomMaterial = {
  id: number | string;
  classroomId: number | string;
  title: string;
  fileUrl: string;
  fileName?: string | null;
  fileType?: string | null;
  createdAt: string;
};

export type ClassroomNotice = {
  id: number | string;
  classroomId: number | string;
  title: string;
  content: string;
  isImportant: boolean;
  createdAt: string;
};

const normaliseVideo = (record: Record<string, any> | null): ClassroomVideo | null => {
  if (!record) return null;
  const id = record.id;
  const classroomId = record.classroom_id ?? record.classroomId ?? record.class_id ?? record.classId;
  const title = (record.title ?? '') as string;
  const url = (record.url as string | undefined) ?? (record.videoUrl as string | undefined) ?? '';
  if (!id || !classroomId || !title || !url) return null;
  return {
    id,
    classroomId,
    title,
    url,
    description: (record.description as string | undefined) ?? null,
    orderNum: Number(record.order_num ?? record.orderNum ?? 0) || 0,
    createdAt:
      (record.created_at as string | undefined) ??
      (record.createdAt as string | undefined) ??
      new Date().toISOString(),
  };
};

const normaliseMaterial = (record: Record<string, any> | null): ClassroomMaterial | null => {
  if (!record) return null;
  const id = record.id;
  const classroomId = record.classroom_id ?? record.classroomId ?? record.class_id ?? record.classId;
  const title = (record.title ?? '') as string;
  const fileUrl = (record.file_url as string | undefined) ?? (record.fileUrl as string | undefined) ?? '';
  if (!id || !classroomId || !title || !fileUrl) return null;
  return {
    id,
    classroomId,
    title,
    fileUrl,
    fileName: (record.file_name as string | undefined) ?? (record.fileName as string | undefined) ?? null,
    fileType: (record.file_type as string | undefined) ?? (record.fileType as string | undefined) ?? null,
    createdAt:
      (record.created_at as string | undefined) ??
      (record.createdAt as string | undefined) ??
      new Date().toISOString(),
  };
};

const normaliseNotice = (record: Record<string, any> | null): ClassroomNotice | null => {
  if (!record) return null;
  const id = record.id;
  const classroomId = record.classroom_id ?? record.classroomId ?? record.class_id ?? record.classId;
  const title = (record.title ?? '') as string;
  const content = (record.content ?? '') as string;
  if (!id || !classroomId || !title) return null;
  return {
    id,
    classroomId,
    title,
    content,
    isImportant: Boolean(record.is_important ?? record.isImportant ?? false),
    createdAt:
      (record.created_at as string | undefined) ??
      (record.createdAt as string | undefined) ??
      new Date().toISOString(),
  };
};

const fetchJson = async (input: RequestInfo, init?: RequestInit) => {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
};

const resolveArrayData = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const resolveSingleData = (data: any) => (data?.data ? data.data : data);

/* --------- Classroom 기본 정보 --------- */

export const getClassrooms = async () =>
  supabase.from('classes').select('*').order('created_at', { ascending: false });

export const deleteClassroom = async (id: string | number) => supabase.from('classes').delete().eq('id', id);

export async function getClassCategories() {
  return supabase.from('class_category').select('*').order('order_num', { ascending: true });
}

/* ----------------------------------
   📌 수정된 목록 API 경로 (list → get)
---------------------------------- */

export const getClassroomVideos = async (classroomId: number | string): Promise<ClassroomVideo[]> => {
  const data = await fetchJson(`/api/classroomVideo/get?classroom_id=${encodeURIComponent(classroomId)}`);
  return resolveArrayData(data)
    .map((item) => normaliseVideo(item as Record<string, any>))
    .filter((item): item is ClassroomVideo => item != null);
};

export const createClassroomVideo = async (payload: Partial<ClassroomVideo>): Promise<ClassroomVideo | null> => {
  const data = await fetchJson('/api/classroomVideo/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      classroom_id: payload.classroomId,
      title: payload.title,
      url: payload.url,
      description: payload.description,
      order_num: payload.orderNum,
    }),
  });
  return normaliseVideo(resolveSingleData(data) as Record<string, any>);
};

export const updateClassroomVideo = async (
  id: string | number,
  payload: Partial<ClassroomVideo>
): Promise<ClassroomVideo | null> => {
  const data = await fetchJson(`/api/classroomVideo/update?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: payload.title,
      url: payload.url,
      description: payload.description,
      order_num: payload.orderNum,
    }),
  });
  return normaliseVideo(resolveSingleData(data) as Record<string, any>);
};

export const deleteClassroomVideo = async (id: string | number): Promise<void> => {
  await fetchJson(`/api/classroomVideo/delete?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
};

/* --------- 자료(Material) --------- */

export const getClassroomMaterials = async (classroomId: number | string): Promise<ClassroomMaterial[]> => {
  const data = await fetchJson(`/api/material/get?classroom_id=${encodeURIComponent(classroomId)}`);
  return resolveArrayData(data)
    .map((item) => normaliseMaterial(item as Record<string, any>))
    .filter((item): item is ClassroomMaterial => item != null);
};

export const createClassroomMaterial = async (
  payload: Partial<ClassroomMaterial>
): Promise<ClassroomMaterial | null> => {
  const data = await fetchJson('/api/material/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      classroom_id: payload.classroomId,
      title: payload.title,
      file_url: payload.fileUrl,
      file_name: payload.fileName,
      file_type: payload.fileType,
    }),
  });
  return normaliseMaterial(resolveSingleData(data) as Record<string, any>);
};

export const updateClassroomMaterial = async (
  id: string | number,
  payload: Partial<ClassroomMaterial>
): Promise<ClassroomMaterial | null> => {
  const data = await fetchJson(`/api/material/update?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: payload.title,
      file_url: payload.fileUrl,
      file_name: payload.fileName,
      file_type: payload.fileType,
    }),
  });
  return normaliseMaterial(resolveSingleData(data) as Record<string, any>);
};

export const deleteClassroomMaterial = async (id: string | number): Promise<void> => {
  await fetchJson(`/api/material/delete?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
};

/* --------- 공지(Notice) --------- */

export const getClassroomNotices = async (classroomId: number | string): Promise<ClassroomNotice[]> => {
  const data = await fetchJson(`/api/classroomNotice/get?classroom_id=${encodeURIComponent(classroomId)}`);
  return resolveArrayData(data)
    .map((item) => normaliseNotice(item as Record<string, any>))
    .filter((item): item is ClassroomNotice => item != null);
};

export const createClassroomNotice = async (
  payload: Partial<ClassroomNotice>
): Promise<ClassroomNotice | null> => {
  const data = await fetchJson('/api/classroomNotice/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      classroom_id: payload.classroomId,
      title: payload.title,
      content: payload.content,
      is_important: payload.isImportant,
    }),
  });
  return normaliseNotice(resolveSingleData(data) as Record<string, any>);
};

export const updateClassroomNotice = async (
  id: string | number,
  payload: Partial<ClassroomNotice>
): Promise<ClassroomNotice | null> => {
  const data = await fetchJson(`/api/classroomNotice/update?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: payload.title,
      content: payload.content,
      is_important: payload.isImportant,
    }),
  });
  return normaliseNotice(resolveSingleData(data) as Record<string, any>);
};

export const deleteClassroomNotice = async (id: string | number): Promise<void> => {
  await fetchJson(`/api/classroomNotice/delete?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
};

/* ---- Filter Helpers ---- */

export const filterVideosByCourse = (videos: ClassroomVideo[], classroomId: string | number) =>
  videos.filter((video) => String(video.classroomId) === String(classroomId));

export const filterMaterialsByCourse = (materials: ClassroomMaterial[], classroomId: string | number) =>
  materials.filter((material) => String(material.classroomId) === String(classroomId));

export const filterNoticesByCourse = (notices: ClassroomNotice[], classroomId: string | number) =>
  notices.filter((notice) => String(notice.classroomId) === String(classroomId));

export type ClassroomCourseSummary = {
  categoryId: string | number;
  categoryName: string;
  categoryOrder: number;
  courseId: string | number;
  courseName: string;
  courseDescription?: string;
  subCategoryOrder: number;
};

export const findCourseSummary = (courses: ClassroomCourseSummary[], courseId: string | number) =>
  courses.find((course) => String(course.courseId) === String(courseId)) ?? null;