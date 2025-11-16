export type SheetContentEntry = Record<string, string | number | boolean | null>;

export type GlobalNoticeRecord = {
  id: string;
  title: string;
  content: string;
  thumbnailUrl?: string | null;
  isVisible: boolean;
  createdAt: string;
};

export type ClassroomVideoRecord = {
  id: string;
  courseId: string;
  categoryId: string;
  title: string;
  videoUrl: string;
  description?: string | null;
  displayOrder: number;
  createdAt: string;
};

export type VodVideoRecord = {
  id: string;
  categoryId: string;
  title: string;
  description?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
  isRecommended: boolean;
  displayOrder: number;
  createdAt: string;
};

export type ClassroomMaterialRecord = {
  id: string;
  courseId: string;
  categoryId: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileName?: string | null;
  fileType: 'file' | 'link';
  createdAt: string;
};

export type ClassroomNoticeRecord = {
  id: string;
  courseId: string;
  categoryId: string;
  title: string;
  content: string;
  isImportant: boolean;
  createdAt: string;
};

export type VodCategory = {
  id: string;
  name: string;
  order: number;
};

export type ContentCollections = {
  globalNotices: GlobalNoticeRecord[];
  classroomVideos: ClassroomVideoRecord[];
  vodVideos: VodVideoRecord[];
  classroomMaterials: ClassroomMaterialRecord[];
  classroomNotices: ClassroomNoticeRecord[];
  vodCategories: VodCategory[];
};

export type LectureItem = {
  id: string;
  courseId: string;
  categoryId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  resourceUrl?: string;
  order: number;
  raw?: Record<string, string>;
};

export type LectureSubCategory = {
  courseId: string;
  courseName: string;
  courseDescription?: string;
  subCategoryOrder: number;
  lectures: LectureItem[];
};

export type LectureCategory = {
  categoryId: string;
  categoryName: string;
  categoryOrder: number;
  subCategories: LectureSubCategory[];
};

export type ClassroomCourseSummary = {
  categoryId: string;
  categoryName: string;
  categoryOrder: number;
  courseId: string;
  courseName: string;
  courseDescription?: string;
  subCategoryOrder: number;
};

const generateId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `content-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normaliseString = (value: unknown, fallback = '') => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (value == null) {
    return fallback;
  }
  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : fallback;
};

const parseBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (['true', 'yes', 'y', '1', '노출', '공개'].includes(normalised)) {
      return true;
    }
    if (['false', 'no', 'n', '0', '비공개'].includes(normalised)) {
      return false;
    }
  }
  return fallback;
};

const parseNumber = (value: unknown, fallback = 0) => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const buildContentCollections = (entries: SheetContentEntry[] = []): ContentCollections => {
  const globalNotices: GlobalNoticeRecord[] = [];
  const classroomVideos: ClassroomVideoRecord[] = [];
  const classroomMaterials: ClassroomMaterialRecord[] = [];
  const classroomNotices: ClassroomNoticeRecord[] = [];
  const vodVideos: VodVideoRecord[] = [];
  const vodCategoryMap = new Map<string, VodCategory>();

  entries.forEach((entry) => {
    const type = normaliseString(entry.type).toLowerCase();
    const baseId = normaliseString(entry.id) || generateId();
    const categoryId = normaliseString(entry.categoryId || entry.category || 'general');
    const courseId = normaliseString(entry.courseId || entry.course || entry.subCategory || 'course');
    const createdAt = normaliseString(entry.createdAt || entry.updatedAt || new Date().toISOString());

    if (['global_notice', 'global', 'notice'].includes(type)) {
      globalNotices.push({
        id: baseId,
        title: normaliseString(entry.title || '공지'),
        content: normaliseString(entry.content || ''),
        thumbnailUrl: normaliseString(entry.thumbnailUrl || entry.thumbnail || '') || null,
        isVisible: parseBoolean(entry.isVisible ?? true, true),
        createdAt,
      });
      return;
    }

    if (['classroom_video', 'video', 'lecture_video'].includes(type)) {
      classroomVideos.push({
        id: baseId,
        courseId,
        categoryId,
        title: normaliseString(entry.title || '강의 영상'),
        videoUrl: normaliseString(entry.videoUrl || entry.url || ''),
        description: normaliseString(entry.description || ''),
        displayOrder: parseNumber(entry.displayOrder || entry.order, 0),
        createdAt,
      });
      return;
    }

    if (['vod', 'vod_video'].includes(type)) {
      const vodCategoryId = normaliseString(entry.vodCategoryId || entry.categoryId || entry.category || 'default');
      const vodCategoryName = normaliseString(entry.vodCategoryName || entry.categoryName || entry.category || 'VOD');
      const vodCategoryOrder = parseNumber(entry.categoryOrder || entry.vodCategoryOrder, 0);
      vodVideos.push({
        id: baseId,
        categoryId: vodCategoryId,
        title: normaliseString(entry.title || 'VOD'),
        description: normaliseString(entry.description || ''),
        videoUrl: normaliseString(entry.videoUrl || entry.url || ''),
        thumbnailUrl: normaliseString(entry.thumbnailUrl || entry.thumbnail || '') || null,
        isRecommended: parseBoolean(entry.isRecommended ?? entry.recommended ?? false, false),
        displayOrder: parseNumber(entry.displayOrder || entry.order, 0),
        createdAt,
      });
      if (!vodCategoryMap.has(vodCategoryId)) {
        vodCategoryMap.set(vodCategoryId, {
          id: vodCategoryId,
          name: vodCategoryName,
          order: vodCategoryOrder,
        });
      }
      return;
    }

    if (['material', 'classroom_material'].includes(type)) {
      const fileTypeValue = normaliseString(entry.fileType || 'file').toLowerCase();
      const fileType: 'file' | 'link' = fileTypeValue === 'link' ? 'link' : 'file';
      classroomMaterials.push({
        id: baseId,
        courseId,
        categoryId,
        title: normaliseString(entry.title || '자료'),
        description: normaliseString(entry.description || ''),
        fileUrl: normaliseString(entry.fileUrl || entry.url || entry.link || ''),
        fileName: normaliseString(entry.fileName || ''),
        fileType,
        createdAt,
      });
      return;
    }

    if (['classroom_notice', 'class_notice'].includes(type)) {
      classroomNotices.push({
        id: baseId,
        courseId,
        categoryId,
        title: normaliseString(entry.title || '공지'),
        content: normaliseString(entry.content || ''),
        isImportant: parseBoolean(entry.isImportant ?? entry.important ?? false, false),
        createdAt,
      });
    }
  });

  const vodCategories = Array.from(vodCategoryMap.values()).sort(
    (a, b) => a.order - b.order || a.name.localeCompare(b.name, 'ko', { sensitivity: 'base' }),
  );

  const sortByDateDesc = (list: { createdAt: string }[]) =>
    list
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    globalNotices: sortByDateDesc(globalNotices),
    classroomVideos: classroomVideos
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    vodVideos: vodVideos
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    classroomMaterials: sortByDateDesc(classroomMaterials),
    classroomNotices: sortByDateDesc(classroomNotices),
    vodCategories,
  };
};

export const flattenLectureCourses = (categories: LectureCategory[]): ClassroomCourseSummary[] =>
  categories.flatMap((category) =>
    category.subCategories.map((subCategory) => ({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      categoryOrder: category.categoryOrder,
      courseId: subCategory.courseId,
      courseName: subCategory.courseName,
      courseDescription: subCategory.courseDescription,
      subCategoryOrder: subCategory.subCategoryOrder,
    })),
  );

export const findCourseSummary = (courses: ClassroomCourseSummary[], courseId: string) =>
  courses.find((course) => course.courseId === courseId) ?? null;

export const filterVideosByCourse = (videos: ClassroomVideoRecord[], courseId: string) =>
  videos.filter((video) => video.courseId === courseId);

export const filterMaterialsByCourse = (materials: ClassroomMaterialRecord[], courseId: string) =>
  materials.filter((material) => material.courseId === courseId);

export const filterNoticesByCourse = (notices: ClassroomNoticeRecord[], courseId: string) =>
  notices.filter((notice) => notice.courseId === courseId);
