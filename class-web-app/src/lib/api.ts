export type ClassInfo = {
  id: number;
  name: string;
};

export type VideoPayload = {
  id: number;
  title: string;
  url: string;
  description?: string | null;
  classId: number;
  createdAt: string;
};

export type MaterialPayload = {
  id: number;
  title: string;
  fileUrl: string;
  description?: string | null;
  classId: number;
  createdAt: string;
};

export type NoticePayload = {
  id: number;
  title: string;
  content: string;
  author?: string | null;
  classId: number;
  createdAt: string;
};

export type FeedbackPayload = {
  id: number;
  userName: string;
  comment: string;
  classId: number;
  createdAt: string;
};

export type AssignmentStatus = '미제출' | '제출됨' | '피드백 완료';
export type AssignmentFileType = 'image' | 'pdf' | 'link' | 'other';

export type AssignmentListItem = {
  id: number;
  title: string;
  classId: number;
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

type ApiResponse<T> = {
  classes?: ClassInfo[];
  videos?: Array<{
    id: number;
    title: string;
    url: string;
    description?: string | null;
    classId: number;
    createdAt: string;
  }>;
  video?: {
    id: number;
    title: string;
    url: string;
    description?: string | null;
    classId: number;
    createdAt: string;
  };
  materials?: Array<{
    id: number;
    title: string;
    fileUrl: string;
    description?: string | null;
    classId: number;
    createdAt: string;
  }>;
  material?: {
    id: number;
    title: string;
    fileUrl: string;
    description?: string | null;
    classId: number;
    createdAt: string;
  };
  notices?: Array<{
    id: number;
    title: string;
    content: string;
    author?: string | null;
    classId: number;
    createdAt: string;
  }>;
  notice?: {
    id: number;
    title: string;
    content: string;
    author?: string | null;
    classId: number;
    createdAt: string;
  };
  feedback?: Array<{
    id: number;
    userName: string;
    comment: string;
    classId: number;
    createdAt: string;
  }> | {
    id: number;
    userName: string;
    comment: string;
    classId: number;
    createdAt: string;
  };
  assignments?: AssignmentListItem[];
  assignment?: AssignmentListItem;
};

const assertResponse = async (response: Response) => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || '요청 처리 중 오류가 발생했습니다.');
  }
};

export const getClasses = async (): Promise<ClassInfo[]> => {
  const response = await fetch('/api/classes');
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  return data.classes ?? [];
};

export const getVideos = async () => {
  const response = await fetch('/api/videos');
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  return data.videos ?? [];
};

export const createVideo = async (payload: { title: string; url: string; description?: string; classId: number }) => {
  const response = await fetch('/api/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  if (!data.video || Array.isArray(data.video)) {
    throw new Error('영상 정보를 확인할 수 없습니다.');
  }
  return data.video;
};

export const getMaterials = async () => {
  const response = await fetch('/api/materials');
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  return data.materials ?? [];
};

export const createMaterial = async (payload: { title: string; fileUrl: string; description?: string; classId: number }) => {
  const response = await fetch('/api/materials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  if (!data.material || Array.isArray(data.material)) {
    throw new Error('자료 정보를 확인할 수 없습니다.');
  }
  return data.material;
};

export const getNotices = async (params: { classId?: number } = {}) => {
  const searchParams = new URLSearchParams();
  if (typeof params.classId === 'number') {
    searchParams.set('classId', String(params.classId));
  }

  const query = searchParams.toString();
  const response = await fetch(`/api/notices${query ? `?${query}` : ''}`);
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  return data.notices ?? [];
};

export const createNotice = async (payload: { title: string; content: string; classId: number; author?: string }) => {
  const response = await fetch('/api/notices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: payload.title,
      content: payload.content,
      author: payload.author,
      class_id: payload.classId,
    }),
  });
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  if (!data.notice || Array.isArray(data.notice)) {
    throw new Error('공지 정보를 확인할 수 없습니다.');
  }
  return data.notice;
};

export const createFeedback = async (payload: { userName: string; comment: string; classId: number }) => {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  if (!data.feedback || Array.isArray(data.feedback)) {
    throw new Error('피드백 정보를 확인할 수 없습니다.');
  }
  return data.feedback;
};

export const getAssignments = async (params: { classId?: number; limit?: number } = {}) => {
  const searchParams = new URLSearchParams();
  if (typeof params.classId === 'number') {
    searchParams.set('classId', String(params.classId));
  }
  if (typeof params.limit === 'number') {
    searchParams.set('limit', String(params.limit));
  }

  const query = searchParams.toString();
  const response = await fetch(`/api/assignments${query ? `?${query}` : ''}`);
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  return (data.assignments ?? []) as AssignmentListItem[];
};

export const createAssignmentSubmission = async (payload: {
  title?: string;
  classId: number;
  studentName?: string;
  studentEmail?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: AssignmentFileType;
  link?: string | null;
  status?: AssignmentStatus;
  submittedAt?: string | null;
}) => {
  const response = await fetch('/api/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await assertResponse(response);
  const data = (await response.json()) as ApiResponse<unknown>;
  if (!data.assignment || Array.isArray(data.assignment)) {
    throw new Error('과제 정보를 확인할 수 없습니다.');
  }
  return data.assignment as AssignmentListItem;
};
