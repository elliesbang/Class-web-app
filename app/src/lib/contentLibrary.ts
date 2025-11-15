export type ClassroomCourse = {
  id: string;
  name: string;
  description?: string;
};

export type ClassroomCategory = {
  id: string;
  name: string;
  courses: ClassroomCourse[];
};

export type VodCategory = {
  id: string;
  name: string;
};

export type GlobalNoticeRecord = {
  notionId: string;
  id: string;
  title: string;
  content: string;
  thumbnailUrl?: string | null;
  isVisible: boolean;
  createdAt: string;
};

export type ClassroomVideoRecord = {
  notionId: string;
  id: string;
  categoryId: string;
  courseId: string;
  title: string;
  videoUrl: string;
  description?: string | null;
  displayOrder: number;
  createdAt: string;
};

export type VodVideoRecord = {
  notionId: string;
  id: string;
  categoryId: string;
  title: string;
  description?: string | null;
  videoUrl: string;
  thumbnailUrl: string;
  isRecommended: boolean;
  displayOrder: number;
  createdAt: string;
};

export type ClassroomMaterialRecord = {
  notionId: string;
  id: string;
  categoryId: string;
  courseId: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileName: string;
  fileType: 'file' | 'link';
  createdAt: string;
};

export type ClassroomNoticeRecord = {
  notionId: string;
  id: string;
  categoryId: string;
  courseId: string;
  title: string;
  content: string;
  isImportant: boolean;
  createdAt: string;
};

export const classroomCategories: ClassroomCategory[] = [
  {
    id: 'skill',
    name: '스킬',
    courses: [
      {
        id: 'candyma',
        name: '캔디마',
        description: '캔바로 만드는 디지털 마케팅 실습 과정입니다.',
      },
      {
        id: 'candup',
        name: '캔디업',
        description: '캔바 활용 고급 편집과 브랜딩 강의입니다.',
      },
      {
        id: 'zhcal-up',
        name: '중캘업',
        description: '중국어 캘리그라피 작품 제작 심화 과정입니다.',
      },
    ],
  },
  {
    id: 'commerce',
    name: '수익화',
    courses: [
      {
        id: 'cangoods',
        name: '캔굿즈',
        description: '캔바 디자인을 상품화하는 실전 수업입니다.',
      },
      {
        id: 'calgoods',
        name: '캘굿즈',
        description: '캘리그라피 굿즈 제작을 위한 실습 강의입니다.',
      },
    ],
  },
  {
    id: 'ai-creation',
    name: 'AI 창작',
    courses: [
      {
        id: 'eggjak',
        name: '에그작',
        description: 'AI 기반 출판물을 제작하는 프로젝트 과정입니다.',
      },
      {
        id: 'eggjakchal',
        name: '에그작챌',
        description: '에그작 참여자를 위한 챌린지형 강의입니다.',
      },
      {
        id: 'nacoljak',
        name: '나컬작',
        description: '나만의 컬러링북을 기획하고 제작하는 과정입니다.',
      },
      {
        id: 'nacoljakchal',
        name: '나컬작챌',
        description: '나컬작 참가자를 위한 실전 챌린지 과정입니다.',
      },
      {
        id: 'michina',
        name: '미치나',
        description: 'AI+캔바 기반 창작 챌린지를 운영하는 실전 과정입니다.',
      },
      {
        id: 'mitemna',
        name: '미템나',
        description: '미리캔버스 템플릿 제작 노하우를 배우는 강의입니다.',
      },
      {
        id: 'earlchal',
        name: '이얼챌',
        description: '중국어 캘리그라피 기초를 다지는 챌린지 과정입니다.',
      },
    ],
  },
];

export const vodCategories: VodCategory[] = [
  { id: 'featured', name: '추천' },
  { id: 'beginner', name: '입문' },
  { id: 'advanced', name: '심화' },
];

export const defaultGlobalNotices: GlobalNoticeRecord[] = [];

export const defaultClassroomVideos: ClassroomVideoRecord[] = [];

export const defaultVodVideos: VodVideoRecord[] = [];

export const defaultClassroomMaterials: ClassroomMaterialRecord[] = [];

export const defaultClassroomNotices: ClassroomNoticeRecord[] = [];

export const contentDestinations = {
  globalNotices: [
    { route: '/', section: 'home.news' },
    { route: '/notices', section: 'notices.list' },
  ],
  classroomVideos: [
    { route: '/class/:courseId', section: 'classroom.videoTab' },
  ],
  vodVideos: [
    { route: '/', section: 'home.vodFeatured' },
    { route: '/vod', section: 'vod.list' },
  ],
  classroomMaterials: [
    { route: '/class/:courseId', section: 'classroom.materialTab' },
  ],
  classroomNotices: [
    { route: '/class/:courseId', section: 'classroom.noticeTab' },
  ],
} as const;

export const findClassroomCategory = (categoryId: string) =>
  classroomCategories.find((category) => category.id === categoryId) ?? null;

export const findClassroomCourse = (courseId: string) => {
  for (const category of classroomCategories) {
    const course = category.courses.find((item) => item.id === courseId);
    if (course) {
      return { category, course } as { category: ClassroomCategory; course: ClassroomCourse };
    }
  }

  return null;
};

export const getClassroomVideosForCourse = (courseId: string) =>
  defaultClassroomVideos
    .filter((video) => video.courseId === courseId)
    .slice()
    .sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

export const getClassroomMaterialsForCourse = (courseId: string) =>
  defaultClassroomMaterials
    .filter((material) => material.courseId === courseId)
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const getClassroomNoticesForCourse = (courseId: string) =>
  defaultClassroomNotices
    .filter((notice) => notice.courseId === courseId)
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const getVodVideosByCategory = (categoryId: string) =>
  defaultVodVideos
    .filter((video) => video.categoryId === categoryId)
    .slice()
    .sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

export const getVisibleGlobalNotices = () =>
  defaultGlobalNotices
    .filter((notice) => notice.isVisible)
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
