import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getClasses, type ClassInfo } from '../lib/api/class';
import {
  getClassroomMaterials,
  getClassroomNotices,
  getClassroomVideos,
  type ClassroomCourseSummary,
  type ClassroomMaterial,
  type ClassroomNotice,
  type ClassroomVideo,
} from '../lib/api/classroom';
import { getGlobalNotices, type GlobalNotice } from '../lib/api/notice';
import { getVodList, type VodCategory, type VodVideo } from '../lib/api/vod';

export type ContentCollections = {
  globalNotices: GlobalNotice[];
  classroomVideos: ClassroomVideo[];
  vodVideos: VodVideo[];
  classroomMaterials: ClassroomMaterial[];
  classroomNotices: ClassroomNotice[];
  vodCategories: VodCategory[];
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

type SheetsDataContextValue = {
  contentCollections: ContentCollections;
  lectures: ClassroomCourseSummary[];
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

const buildCourseSummaries = (classes: ClassInfo[]): ClassroomCourseSummary[] =>
  classes.map((classItem, index) => ({
    categoryId: classItem.categoryId ?? `category-${index + 1}`,
    categoryName: classItem.category || '일반',
    categoryOrder: index,
    courseId: classItem.id,
    courseName: classItem.name,
    courseDescription: classItem.duration,
    subCategoryOrder: 0,
  }));

export const SheetsDataProvider = ({ children }: { children: ReactNode }) => {
  const [contentCollections, setContentCollections] = useState<ContentCollections>(defaultCollections);
  const [lectureCourses, setLectureCourses] = useState<ClassroomCourseSummary[]>([]);
  const [assignments] = useState<AssignmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [classes, vodData, globalNotices] = await Promise.all([getClasses(), getVodList(), getGlobalNotices()]);
      const courseSummaries = buildCourseSummaries(classes);

      const classroomRequests = classes.map((classItem) =>
        Promise.all([
          getClassroomVideos(classItem.id),
          getClassroomMaterials(classItem.id),
          getClassroomNotices(classItem.id),
        ]),
      );

      const classroomResults = await Promise.all(classroomRequests);
      const videos: ClassroomVideo[] = [];
      const materials: ClassroomMaterial[] = [];
      const notices: ClassroomNotice[] = [];

      classroomResults.forEach(([videoList, materialList, noticeList]) => {
        videos.push(
          ...videoList.map((video) => ({ ...video, courseId: video.courseId ?? '' })),
        );
        materials.push(
          ...materialList.map((material) => ({ ...material, courseId: material.courseId ?? '' })),
        );
        notices.push(
          ...noticeList.map((notice) => ({ ...notice, courseId: notice.courseId ?? '' })),
        );
      });

      setContentCollections({
        globalNotices,
        classroomVideos: videos,
        vodVideos: vodData.videos,
        classroomMaterials: materials,
        classroomNotices: notices,
        vodCategories: vodData.categories,
      });
      setLectureCourses(courseSummaries);
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

  const value = useMemo(
    () => ({
      contentCollections,
      lectures: lectureCourses,
      lectureCourses,
      assignments,
      loading,
      error,
      refresh: loadData,
    }),
    [assignments, contentCollections, error, lectureCourses, loadData, loading],
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
