import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AssignmentFileType, AssignmentListItem, AssignmentStatus } from '../lib/api';
import {
  buildContentCollections,
  flattenLectureCourses,
  type ClassroomCourseSummary,
  type ContentCollections,
  type LectureCategory,
  type SheetContentEntry,
} from '../lib/contentLibrary';

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

const parseNumber = (value: unknown): number | null => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : null;
};

const parseAssignmentStatus = (value: unknown): AssignmentStatus => {
  const normalised = normaliseString(value).replace(/\s+/g, '');
  const allowed: AssignmentStatus[] = ['미제출', '제출됨', '피드백 완료'];
  const match = allowed.find((status) => status.replace(/\s+/g, '') === normalised);
  return match ?? '제출됨';
};

const parseAssignmentFileType = (value: unknown): AssignmentFileType => {
  const normalised = normaliseString(value).toLowerCase();
  if (normalised === 'image' || normalised === 'pdf' || normalised === 'link') {
    return normalised as AssignmentFileType;
  }
  return 'other';
};

const slugifyKey = (value: string, fallback: string) => {
  const base = normaliseString(value, fallback);
  if (!base) {
    return fallback;
  }
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
};

const mapLectureItems = (categoryId: string, courseId: string, lectures: unknown): LectureCategory['subCategories'][number]['lectures'] => {
  if (!Array.isArray(lectures)) {
    return [];
  }

  return lectures.map((lecture, index) => {
    const record = (typeof lecture === 'object' && lecture !== null
      ? (lecture as Record<string, unknown>)
      : {}) as Record<string, unknown>;
    const titleSource =
      (record['title(강좌명)'] as string | undefined) ??
      (record.title as string | undefined) ??
      (record.name as string | undefined) ??
      lecture;

    return {
      id: `${courseId}-lecture-${index + 1}`,
      courseId,
      categoryId,
      title: normaliseString(titleSource || `강의 ${index + 1}`, `강의 ${index + 1}`),
      description: normaliseString((record.description as string | undefined) ?? '', ''),
      videoUrl: normaliseString((record.videoUrl as string | undefined) ?? (record.url as string | undefined) ?? ''),
      resourceUrl: normaliseString(
        (record.resourceUrl as string | undefined) ?? (record.attachment as string | undefined) ?? '',
      ),
      order: index,
      raw: record,
    };
  });
};

const mapClassroomPayload = (payload: unknown): LectureCategory[] => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return [];
  }

  const grouped = payload as Record<string, unknown>;
  const categories: LectureCategory[] = [];

  Object.entries(grouped).forEach(([categoryName, subCategories], categoryIndex) => {
    const normalisedCategoryName = normaliseString(categoryName, `카테고리 ${categoryIndex + 1}`);
    const categoryId = slugifyKey(normalisedCategoryName || `category-${categoryIndex + 1}`, `category-${categoryIndex + 1}`);
    const subCategoryEntries =
      subCategories && typeof subCategories === 'object' && !Array.isArray(subCategories)
        ? (subCategories as Record<string, unknown>)
        : {};

    const mappedSubCategories: LectureCategory['subCategories'] = Object.entries(subCategoryEntries).map(
      ([subCategoryName, lectures], subIndex) => {
        const courseName = normaliseString(subCategoryName, `코스 ${subIndex + 1}`);
        const courseId = slugifyKey(`${categoryId}-${courseName || `course-${subIndex + 1}`}`, `${categoryId}-course-${subIndex + 1}`);
        return {
          courseId,
          courseName: courseName || `코스 ${subIndex + 1}`,
          courseDescription: '',
          subCategoryOrder: subIndex,
          lectures: mapLectureItems(categoryId, courseId, lectures),
        };
      },
    );

    categories.push({
      categoryId,
      categoryName: normalisedCategoryName || `카테고리 ${categoryIndex + 1}`,
      categoryOrder: categoryIndex,
      subCategories: mappedSubCategories,
    });
  });

  return categories;
};

const mapAssignments = (rows: SheetContentEntry[]): AssignmentListItem[] =>
  rows.map((row, index) => {
    const fallbackCreatedAt = new Date().toISOString();
    const createdAt = normaliseString(row.createdAt || row.created_at || row.timestamp || fallbackCreatedAt);
    const submittedAt = normaliseString(row.submittedAt || row.updatedAt || row.submitted_at || createdAt);
    return {
      id: parseNumber(row.id || row.ID || row.번호) ?? index + 1,
      title: normaliseString(row.title || row.assignment || '과제'),
      classId: parseNumber(row.classId || row.class_id || row.classNumber),
      className: normaliseString(row.className || row.course || row.class || '미지정 클래스'),
      studentName: normaliseString(row.studentName || row.name || '이름 미입력'),
      studentEmail: normaliseString(row.studentEmail || row.email || ''),
      fileUrl: normaliseString(row.fileUrl || row.attachmentUrl || row.url || ''),
      fileName: normaliseString(row.fileName || ''),
      fileType: parseAssignmentFileType(row.fileType || row.type),
      link: normaliseString(row.link || row.url || ''),
      status: parseAssignmentStatus(row.status),
      submittedAt,
      createdAt,
    };
  });

type SheetsDataContextValue = {
  contentEntries: SheetContentEntry[];
  contentCollections: ContentCollections;
  lectures: LectureCategory[];
  lectureCourses: ClassroomCourseSummary[];
  assignments: AssignmentListItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const defaultCollections: ContentCollections = {
  globalNotices: [],
  classroomVideos: [],
  vodVideos: [],
  classroomMaterials: [],
  classroomNotices: [],
  vodCategories: [],
};

const SheetsDataContext = createContext<SheetsDataContextValue | undefined>(undefined);

const extractDataArray = (payload: unknown): SheetContentEntry[] => {
  if (Array.isArray(payload)) {
    return payload as SheetContentEntry[];
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: SheetContentEntry[] }).data;
  }
  return [];
};

export const SheetsDataProvider = ({ children }: { children: ReactNode }) => {
  const [contentEntries, setContentEntries] = useState<SheetContentEntry[]>([]);
  const [lectures, setLectures] = useState<LectureCategory[]>([]);
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [contentResponse, lectureResponse] = await Promise.all([
        fetch('/api/content/list'),
        fetch('/api/classroom/list'),
      ]);

      if (!contentResponse.ok || !lectureResponse.ok) {
        throw new Error('시트 데이터를 불러오지 못했습니다.');
      }

      const [contentPayload, lecturePayload] = await Promise.all([
        contentResponse.json(),
        lectureResponse.json(),
      ]);

      const mapContentRecords = (payload: unknown): SheetContentEntry[] => {
        const records = extractDataArray(payload).length > 0
          ? extractDataArray(payload)
          : Array.isArray((payload as { results?: unknown[] })?.results)
            ? ((payload as { results: SheetContentEntry[] }).results ?? [])
            : Array.isArray(payload)
              ? (payload as SheetContentEntry[])
              : [];

        return records.map((entry) => {
          const record = entry as Record<string, unknown>;
          const orderNum = record.order_num ?? record.orderNum ?? 0;
          const createdAt = (record.created_at ?? record.createdAt ?? new Date().toISOString()) as string;
          const classroomId = record.classroom_id ?? record.classroomId ?? record.courseId ?? '';
          const vodCategoryId = record.vod_category_id ?? record.vodCategoryId ?? record.categoryId ?? null;

          return {
            ...record,
            id: (record.id as string | number | undefined) ?? `content-${Date.now()}`,
            type: record.type ?? record.content_type ?? '',
            title: record.title ?? record.name ?? '',
            content: record.description ?? record.content ?? '',
            description: record.description ?? '',
            videoUrl: record.content_url ?? record.videoUrl ?? record.url ?? '',
            url: record.content_url ?? record.videoUrl ?? record.url ?? '',
            thumbnailUrl: record.thumbnail_url ?? record.thumbnailUrl ?? '',
            categoryId: vodCategoryId ?? classroomId ?? '',
            courseId: classroomId ?? '',
            displayOrder: typeof orderNum === 'number' ? orderNum : Number(orderNum) || 0,
            order: typeof orderNum === 'number' ? orderNum : Number(orderNum) || 0,
            vodCategoryId: vodCategoryId ?? undefined,
            createdAt,
          } as SheetContentEntry;
        });
      };

      const mapClassroomRecordsToLectures = (payload: unknown): LectureCategory[] => {
        const records = Array.isArray((payload as { results?: unknown[] })?.results)
          ? ((payload as { results: Record<string, unknown>[] }).results ?? [])
          : Array.isArray(payload)
            ? (payload as Record<string, unknown>[])
            : [];

        const categoryMap = new Map<string, LectureCategory>();

        records.forEach((record, index) => {
          const categoryId = normaliseString(record.category_id ?? record.categoryId ?? 'default', 'default');
          const categoryName = normaliseString(
            record.category_name ?? record.categoryName ?? '일반 카테고리',
            '일반 카테고리',
          );
          const categoryOrder = typeof record.order_num === 'number' ? record.order_num : index;

          if (!categoryMap.has(categoryId)) {
            categoryMap.set(categoryId, {
              categoryId,
              categoryName,
              categoryOrder,
              subCategories: [],
            });
          }

          const courseId = normaliseString(record.id ?? `course-${index + 1}`, `course-${index + 1}`);
          const courseName = normaliseString(record.name ?? record.title ?? `코스 ${index + 1}`, `코스 ${index + 1}`);

          const targetCategory = categoryMap.get(categoryId)!;
          targetCategory.subCategories.push({
            courseId,
            courseName,
            courseDescription: normaliseString(record.description ?? ''),
            subCategoryOrder: targetCategory.subCategories.length,
            lectures: [],
          });
        });

        return Array.from(categoryMap.values());
      };

      setContentEntries(mapContentRecords(contentPayload));
      setLectures(mapClassroomRecordsToLectures(lecturePayload));
      setAssignments([]);
    } catch (fetchError) {
      console.error('[SheetsDataProvider] failed to fetch data', fetchError);
      setError('데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const contentCollections = useMemo(() => buildContentCollections(contentEntries), [contentEntries]);
  const lectureCourses = useMemo(() => flattenLectureCourses(lectures), [lectures]);

  const value = useMemo(
    () => ({
      contentEntries,
      contentCollections,
      lectures,
      lectureCourses,
      assignments,
      loading,
      error,
      refresh: loadData,
    }),
    [assignments, contentCollections, contentEntries, error, lectureCourses, lectures, loadData, loading],
  );

  return <SheetsDataContext.Provider value={value}>{children}</SheetsDataContext.Provider>;
};

export const useSheetsData = () => {
  const context = useContext(SheetsDataContext);
  if (!context) {
    throw new Error('useSheetsData must be used within a SheetsDataProvider.');
  }
  return context;
};
