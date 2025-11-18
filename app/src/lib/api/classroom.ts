import { apiFetch } from './apiClient';

export type ClassroomVideo = {
  id: number | string;
  courseId: number | string;
  categoryId: number | string;
  title: string;
  videoUrl: string;
  description?: string | null;
  displayOrder: number;
  createdAt: string;
};

export type ClassroomMaterial = {
  id: number | string;
  courseId: number | string;
  categoryId: number | string;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileName?: string | null;
  fileType: 'file' | 'link';
  createdAt: string;
};

export type ClassroomNotice = {
  id: number | string;
  courseId: number | string;
  categoryId: number | string;
  title: string;
  content: string;
  isImportant: boolean;
  createdAt: string;
};

const normaliseVideo = (input: unknown): ClassroomVideo | null => {
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;
  const id = record.id ?? record.videoId;
  const title = (record.title ?? record.name ?? '') as string;
  const videoUrl = (record.videoUrl ?? record.url ?? '') as string;
  const courseId = record.courseId ?? record.classId ?? record.class_id;
  if (!id || !title || !videoUrl || courseId == null) return null;
  return {
    id,
    courseId,
    categoryId: record.categoryId ?? record.category_id ?? 'default',
    title,
    videoUrl,
    description: (record.description as string | undefined) ?? null,
    displayOrder: Number(record.displayOrder ?? record.order ?? 0) || 0,
    createdAt: (record.createdAt as string | undefined) ?? new Date().toISOString(),
  };
};

const normaliseMaterial = (input: unknown): ClassroomMaterial | null => {
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;
  const id = record.id ?? record.materialId;
  const title = (record.title ?? record.name ?? '') as string;
  const fileUrl = (record.fileUrl ?? record.url ?? '') as string;
  const courseId = record.courseId ?? record.classId ?? record.class_id;
  if (!id || !title || !fileUrl || courseId == null) return null;
  return {
    id,
    courseId,
    categoryId: record.categoryId ?? record.category_id ?? 'default',
    title,
    description: (record.description as string | undefined) ?? null,
    fileUrl,
    fileName: (record.fileName as string | undefined) ?? null,
    fileType: (record.fileType as ClassroomMaterial['fileType'] | undefined) ?? 'file',
    createdAt: (record.createdAt as string | undefined) ?? new Date().toISOString(),
  };
};

const normaliseNotice = (input: unknown): ClassroomNotice | null => {
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;
  const id = record.id ?? record.noticeId;
  const title = (record.title ?? record.name ?? '') as string;
  const content = (record.content ?? '') as string;
  const courseId = record.courseId ?? record.classId ?? record.class_id;
  if (!id || !title || !courseId) return null;
  return {
    id,
    courseId,
    categoryId: record.categoryId ?? record.category_id ?? 'default',
    title,
    content,
    isImportant: Boolean(record.isImportant ?? record.important ?? false),
    createdAt: (record.createdAt as string | undefined) ?? new Date().toISOString(),
  };
};

const normaliseList = <T>(payload: unknown, mapper: (value: unknown) => T | null): T[] => {
  if (Array.isArray(payload)) {
    return payload.map(mapper).filter((item): item is T => item != null);
  }
  if (payload && typeof payload === 'object') {
    const source = payload as { results?: unknown[]; data?: unknown[] };
    const list = Array.isArray(source.results) ? source.results : Array.isArray(source.data) ? source.data : [];
    return list.map(mapper).filter((item): item is T => item != null);
  }
  return [];
};

export const getClassroomVideos = async (classId: number | string) => {
  const data = await apiFetch<unknown>(`/classroom/videos?classId=${encodeURIComponent(String(classId))}`);
  return normaliseList<ClassroomVideo>(data, normaliseVideo);
};

export const getClassroomMaterials = async (classId: number | string) => {
  const data = await apiFetch<unknown>(`/classroom/materials?classId=${encodeURIComponent(String(classId))}`);
  return normaliseList<ClassroomMaterial>(data, normaliseMaterial);
};

export const getClassroomNotices = async (classId: number | string) => {
  const data = await apiFetch<unknown>(`/classroom/notices?classId=${encodeURIComponent(String(classId))}`);
  return normaliseList<ClassroomNotice>(data, normaliseNotice);
};

export const createClassroomVideo = async (payload: Partial<ClassroomVideo>) => {
  return apiFetch<ClassroomVideo>('/classroom/videos', { method: 'POST', body: JSON.stringify(payload) });
};

export const updateClassroomVideo = async (id: string | number, payload: Partial<ClassroomVideo>) => {
  return apiFetch<ClassroomVideo>(`/classroom/videos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
};

export const deleteClassroomVideo = async (id: string | number) => {
  await apiFetch(`/classroom/videos/${id}`, { method: 'DELETE', skipJsonParse: true });
};

export const createClassroomMaterial = async (payload: Partial<ClassroomMaterial>) => {
  return apiFetch<ClassroomMaterial>('/classroom/materials', { method: 'POST', body: JSON.stringify(payload) });
};

export const updateClassroomMaterial = async (id: string | number, payload: Partial<ClassroomMaterial>) => {
  return apiFetch<ClassroomMaterial>(`/classroom/materials/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
};

export const deleteClassroomMaterial = async (id: string | number) => {
  await apiFetch(`/classroom/materials/${id}`, { method: 'DELETE', skipJsonParse: true });
};

export const createClassroomNotice = async (payload: Partial<ClassroomNotice>) => {
  return apiFetch<ClassroomNotice>('/classroom/notices', { method: 'POST', body: JSON.stringify(payload) });
};

export const updateClassroomNotice = async (id: string | number, payload: Partial<ClassroomNotice>) => {
  return apiFetch<ClassroomNotice>(`/classroom/notices/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
};

export const deleteClassroomNotice = async (id: string | number) => {
  await apiFetch(`/classroom/notices/${id}`, { method: 'DELETE', skipJsonParse: true });
};

export const createFeedback = async (payload: { userName: string; comment: string; classId: number }) => {
  return apiFetch('/feedback', { method: 'POST', body: JSON.stringify(payload) });
};

export const filterVideosByCourse = (videos: ClassroomVideo[], courseId: string | number) =>
  videos.filter((video) => String(video.courseId) === String(courseId));

export const filterMaterialsByCourse = (materials: ClassroomMaterial[], courseId: string | number) =>
  materials.filter((material) => String(material.courseId) === String(courseId));

export const filterNoticesByCourse = (notices: ClassroomNotice[], courseId: string | number) =>
  notices.filter((notice) => String(notice.courseId) === String(courseId));

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
