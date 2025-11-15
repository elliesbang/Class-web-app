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

const now = new Date();
const toIsoDate = (offsetDays: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() - offsetDays);
  return date.toISOString();
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

export const defaultGlobalNotices: GlobalNoticeRecord[] = [
  {
    notionId: '00000000-0000-0000-0000-000000000101',
    id: 'notice-20251020',
    title: '11월 라이브 클래스 일정 안내',
    content: '11월에는 캔디마 실전반과 미치나 챌린지가 새롭게 열립니다. 상세 일정은 강의실 공지를 확인해 주세요.',
    thumbnailUrl: '/images/notices/notice-november.png',
    isVisible: true,
    createdAt: toIsoDate(2),
  },
  {
    notionId: '00000000-0000-0000-0000-000000000102',
    id: 'notice-20251015',
    title: 'VOD 콘텐츠 업데이트',
    content: '출판 라인 VOD에 새로운 템플릿 강좌가 추가되었습니다. 지금 바로 확인해 보세요!',
    thumbnailUrl: '/images/notices/vod-update.png',
    isVisible: true,
    createdAt: toIsoDate(7),
  },
  {
    notionId: '00000000-0000-0000-0000-000000000103',
    id: 'notice-20251007',
    title: '추석 연휴 고객센터 휴무 안내',
    content: '9월 14일부터 16일까지 고객센터가 휴무입니다. 강의는 정상 이용 가능합니다.',
    thumbnailUrl: null,
    isVisible: false,
    createdAt: toIsoDate(15),
  },
];

export const defaultClassroomVideos: ClassroomVideoRecord[] = [
  {
    notionId: '00000000-0000-0000-0000-000000000201',
    id: 'video-candyma-1',
    categoryId: 'skill',
    courseId: 'candyma',
    title: '오리엔테이션과 과제 안내',
    videoUrl: 'https://player.vimeo.com/video/001',
    description: '첫 주차 운영 가이드와 제출 규칙을 안내합니다.',
    displayOrder: 0,
    createdAt: toIsoDate(1),
  },
  {
    notionId: '00000000-0000-0000-0000-000000000202',
    id: 'video-candyma-2',
    categoryId: 'skill',
    courseId: 'candyma',
    title: '캔바 브랜딩 실습',
    videoUrl: 'https://player.vimeo.com/video/002',
    description: '실습 파일과 함께 따라오세요.',
    displayOrder: 1,
    createdAt: toIsoDate(0),
  },
  {
    notionId: '00000000-0000-0000-0000-000000000203',
    id: 'video-michina-1',
    categoryId: 'ai-creation',
    courseId: 'michina',
    title: '챌린지 킥오프',
    videoUrl: 'https://player.vimeo.com/video/101',
    description: '3주 프로그램 오리엔테이션 영상입니다.',
    displayOrder: 0,
    createdAt: toIsoDate(3),
  },
  {
    notionId: '00000000-0000-0000-0000-000000000204',
    id: 'video-nacoljak-1',
    categoryId: 'ai-creation',
    courseId: 'nacoljak',
    title: '컬러링북 기획 워크숍',
    videoUrl: 'https://player.vimeo.com/video/201',
    description: '콘셉트와 타깃 분석 방법을 소개합니다.',
    displayOrder: 0,
    createdAt: toIsoDate(5),
  },
];

export const defaultVodVideos: VodVideoRecord[] = [
  {
    notionId: '00000000-0000-0000-0000-000000000301',
    id: 'vod-featured-1',
    categoryId: 'featured',
    title: '디자인 템플릿으로 수익 만들기',
    description: '엘리의방 대표 강사가 알려주는 템플릿 수익화 전략',
    videoUrl: 'https://player.vimeo.com/video/301',
    thumbnailUrl: '/images/vod/vod-featured-1.png',
    isRecommended: true,
    displayOrder: 0,
    createdAt: toIsoDate(0),
  },
  {
    notionId: '00000000-0000-0000-0000-000000000302',
    id: 'vod-featured-2',
    categoryId: 'featured',
    title: '챌린지 운영 베스트 프랙티스',
    description: '미치나 운영진이 공개하는 실전 운영 노하우',
    videoUrl: 'https://player.vimeo.com/video/302',
    thumbnailUrl: '/images/vod/vod-featured-2.png',
    isRecommended: true,
    displayOrder: 1,
    createdAt: toIsoDate(4),
  },
  {
    notionId: '00000000-0000-0000-0000-000000000303',
    id: 'vod-beginner-1',
    categoryId: 'beginner',
    title: '캔바 기초 다지기',
    description: '처음 시작하는 분들을 위한 캔바 기본기 강의',
    videoUrl: 'https://player.vimeo.com/video/401',
    thumbnailUrl: '/images/vod/vod-beginner-1.png',
    isRecommended: false,
    displayOrder: 0,
    createdAt: toIsoDate(10),
  },
  {
    notionId: '00000000-0000-0000-0000-000000000304',
    id: 'vod-advanced-1',
    categoryId: 'advanced',
    title: 'AI 기반 출판물 제작',
    description: 'AI 툴을 활용해 바로 적용 가능한 출판물 제작 노하우',
    videoUrl: 'https://player.vimeo.com/video/501',
    thumbnailUrl: '/images/vod/vod-advanced-1.png',
    isRecommended: false,
    displayOrder: 0,
    createdAt: toIsoDate(8),
  },
];

export const defaultClassroomMaterials: ClassroomMaterialRecord[] = [
  {
    notionId: '00000000-0000-0000-0000-000000000401',
    id: 'material-candyma-1',
    categoryId: 'skill',
    courseId: 'candyma',
    title: '브랜딩 키트 템플릿',
    description: '강의에서 사용하는 예제 템플릿입니다.',
    fileUrl: '/files/candyma-branding-kit.pdf',
    fileName: 'candyma-branding-kit.pdf',
    fileType: 'file',
    createdAt: toIsoDate(1),
  },
  {
    notionId: '00000000-0000-0000-0000-000000000402',
    id: 'material-candyma-2',
    categoryId: 'skill',
    courseId: 'candyma',
    title: '실습 노션 링크',
    description: '실습 과제를 관리하는 노션 페이지입니다.',
    fileUrl: 'https://notion.so/candyma-practice',
    fileName: '실습 노션 페이지',
    fileType: 'link',
    createdAt: toIsoDate(2),
  },
  {
    notionId: '00000000-0000-0000-0000-000000000403',
    id: 'material-michina-1',
    categoryId: 'ai-creation',
    courseId: 'michina',
    title: '챌린지 워크북',
    description: '3주간 사용되는 워크북 PDF입니다.',
    fileUrl: '/files/michina-workbook.pdf',
    fileName: 'michina-workbook.pdf',
    fileType: 'file',
    createdAt: toIsoDate(3),
  },
];

export const defaultClassroomNotices: ClassroomNoticeRecord[] = [
  {
    notionId: '00000000-0000-0000-0000-000000000501',
    id: 'notice-candyma-1',
    categoryId: 'skill',
    courseId: 'candyma',
    title: '1주차 제출 기한 안내',
    content: '1주차 과제는 일요일 23:59까지 제출해주세요.',
    isImportant: true,
    createdAt: toIsoDate(1),
  },
  {
    notionId: '00000000-0000-0000-0000-000000000502',
    id: 'notice-michina-1',
    categoryId: 'ai-creation',
    courseId: 'michina',
    title: '미치나 ZOOM 링크',
    content: '매주 수요일 20시에 진행되는 라이브 세션 링크입니다.',
    isImportant: false,
    createdAt: toIsoDate(2),
  },
  {
    notionId: '00000000-0000-0000-0000-000000000503',
    id: 'notice-nacoljak-1',
    categoryId: 'ai-creation',
    courseId: 'nacoljak',
    title: '참고 자료 모음',
    content: '컬러링북 기획에 도움이 되는 자료를 확인해 주세요.',
    isImportant: false,
    createdAt: toIsoDate(4),
  },
];

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
