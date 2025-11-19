import { supabase } from '../supabaseClient';

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

const normaliseVideo = (record: Record<string, any> | null): ClassroomVideo | null => {
  if (!record) return null;
  const id = record.id ?? record.videoId;
  const title = (record.title ?? record.name ?? '') as string;
  const videoUrl = (record.video_url as string | undefined) ?? (record.videoUrl as string | undefined) ?? '';
  const courseId = record.class_id ?? record.courseId;
  if (!id || !title || !videoUrl || courseId == null) return null;
  return {
    id,
    courseId,
    categoryId: record.category_id ?? record.categoryId ?? 'default',
    title,
    videoUrl,
    description: (record.description as string | undefined) ?? null,
    displayOrder: Number(record.display_order ?? record.order ?? 0) || 0,
    createdAt: (record.created_at as string | undefined) ?? new Date().toISOString(),
  };
};

const normaliseMaterial = (record: Record<string, any> | null): ClassroomMaterial | null => {
  if (!record) return null;
  const id = record.id ?? record.materialId;
  const title = (record.title ?? record.name ?? '') as string;
  const fileUrl = (record.file_url as string | undefined) ?? (record.fileUrl as string | undefined) ?? '';
  const courseId = record.class_id ?? record.courseId;
  if (!id || !title || !fileUrl || courseId == null) return null;
  return {
    id,
    courseId,
    categoryId: record.category_id ?? record.categoryId ?? 'default',
    title,
    description: (record.description as string | undefined) ?? null,
    fileUrl,
    fileName: (record.file_name as string | undefined) ?? (record.fileName as string | undefined) ?? null,
    fileType: (record.file_type as ClassroomMaterial['fileType'] | undefined) ?? 'file',
    createdAt: (record.created_at as string | undefined) ?? new Date().toISOString(),
  };
};

const normaliseNotice = (record: Record<string, any> | null): ClassroomNotice | null => {
  if (!record) return null;
  const id = record.id ?? record.noticeId;
  const title = (record.title ?? record.name ?? '') as string;
  const content = (record.content ?? '') as string;
  const courseId = record.class_id ?? record.courseId;
  if (!id || !title || !courseId) return null;
  return {
    id,
    courseId,
    categoryId: record.category_id ?? record.categoryId ?? 'default',
    title,
    content,
    isImportant: Boolean(record.is_important ?? record.isImportant ?? false),
    createdAt: (record.created_at as string | undefined) ?? new Date().toISOString(),
  };
};

const fetchContent = async (classId: number | string, type: string) => {
  const { data, error } = await supabase
    .from('classroom_content')
    .select('*')
    .eq('class_id', classId)
    .eq('type', type);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
};

export const getClassroomVideos = async (classId: number | string) => {
  const data = await fetchContent(classId, 'video');
  return data.map((item) => normaliseVideo(item as Record<string, any>)).filter((item): item is ClassroomVideo => item != null);
};

export const getClassroomMaterials = async (classId: number | string) => {
  const data = await fetchContent(classId, 'material');
  return data
    .map((item) => normaliseMaterial(item as Record<string, any>))
    .filter((item): item is ClassroomMaterial => item != null);
};

export const getClassroomNotices = async (classId: number | string) => {
  const data = await fetchContent(classId, 'notice');
  return data.map((item) => normaliseNotice(item as Record<string, any>)).filter((item): item is ClassroomNotice => item != null);
};

export const createClassroomVideo = async (payload: Partial<ClassroomVideo>) => {
  const { data, error } = await supabase
    .from('classroom_content')
    .insert({
      type: 'video',
      class_id: payload.courseId,
      category_id: payload.categoryId,
      title: payload.title,
      description: payload.description,
      video_url: payload.videoUrl,
      display_order: payload.displayOrder,
    })
    .select();

  if (error) throw new Error(error.message);
  return normaliseVideo((data ?? [])[0] as Record<string, any>);
};

export const updateClassroomVideo = async (id: string | number, payload: Partial<ClassroomVideo>) => {
  const { data, error } = await supabase
    .from('classroom_content')
    .update({
      title: payload.title,
      description: payload.description,
      video_url: payload.videoUrl,
      display_order: payload.displayOrder,
      category_id: payload.categoryId,
    })
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return normaliseVideo((data ?? [])[0] as Record<string, any>);
};

export const deleteClassroomVideo = async (id: string | number) => {
  const { error } = await supabase.from('classroom_content').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const createClassroomMaterial = async (payload: Partial<ClassroomMaterial>) => {
  const { data, error } = await supabase
    .from('classroom_content')
    .insert({
      type: 'material',
      class_id: payload.courseId,
      category_id: payload.categoryId,
      title: payload.title,
      description: payload.description,
      file_url: payload.fileUrl,
      file_name: payload.fileName,
      file_type: payload.fileType,
    })
    .select();

  if (error) throw new Error(error.message);
  return normaliseMaterial((data ?? [])[0] as Record<string, any>);
};

export const updateClassroomMaterial = async (id: string | number, payload: Partial<ClassroomMaterial>) => {
  const { data, error } = await supabase
    .from('classroom_content')
    .update({
      title: payload.title,
      description: payload.description,
      file_url: payload.fileUrl,
      file_name: payload.fileName,
      file_type: payload.fileType,
      category_id: payload.categoryId,
    })
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return normaliseMaterial((data ?? [])[0] as Record<string, any>);
};

export const deleteClassroomMaterial = async (id: string | number) => {
  const { error } = await supabase.from('classroom_content').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const createClassroomNotice = async (payload: Partial<ClassroomNotice>) => {
  const { data, error } = await supabase
    .from('classroom_content')
    .insert({
      type: 'notice',
      class_id: payload.courseId,
      category_id: payload.categoryId,
      title: payload.title,
      content: payload.content,
      is_important: payload.isImportant,
    })
    .select();

  if (error) throw new Error(error.message);
  return normaliseNotice((data ?? [])[0] as Record<string, any>);
};

export const updateClassroomNotice = async (id: string | number, payload: Partial<ClassroomNotice>) => {
  const { data, error } = await supabase
    .from('classroom_content')
    .update({
      title: payload.title,
      content: payload.content,
      is_important: payload.isImportant,
      category_id: payload.categoryId,
    })
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return normaliseNotice((data ?? [])[0] as Record<string, any>);
};

export const deleteClassroomNotice = async (id: string | number) => {
  const { error } = await supabase.from('classroom_content').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const createFeedback = async (payload: { userName: string; comment: string; classId: number }) => {
  const { error } = await supabase.from('classroom_content').insert({
    type: 'feedback',
    class_id: payload.classId,
    content: payload.comment,
    title: payload.userName,
  });

  if (error) throw new Error(error.message);
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
