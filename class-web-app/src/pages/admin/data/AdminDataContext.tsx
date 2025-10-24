import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type AssignmentStatus = '미제출' | '제출됨' | '피드백 완료';
export type AssignmentFileType = 'image' | 'pdf' | 'link' | 'other';

type StudentInfo = {
  name: string;
  email: string;
};

export type Assignment = {
  id: number;
  title: string;
  course: string;
  student: StudentInfo;
  submittedAt: string | null;
  status: AssignmentStatus;
  fileType: AssignmentFileType;
  fileUrl?: string;
  link?: string | null;
};

export type Feedback = {
  id: number;
  assignmentId: number;
  course: string;
  student: StudentInfo;
  content: string;
  author: string;
  createdAt: string;
  attachmentUrl?: string;
  classId: number | null;
};

type AdminDataContextValue = {
  assignments: Assignment[];
  feedbacks: Feedback[];
  addFeedback: (payload: {
    assignmentId: number;
    content: string;
    author: string;
    attachmentUrl?: string;
    classId?: number | null;
  }) => void;
  updateFeedback: (feedbackId: number, updates: Partial<Omit<Feedback, 'id' | 'assignmentId' | 'course' | 'student'>>) => void;
  deleteFeedback: (feedbackId: number) => void;
  deleteAssignment: (assignmentId: number) => void;
  batchResetCourse: (course: string) => void;
};

const initialAssignments: Assignment[] = [
  {
    id: 101,
    title: '3회차 미치나 요소 디자인',
    course: '미치나 8기',
    student: { name: '이영희', email: 'lee@test.com' },
    submittedAt: '2025-10-22T14:30:00',
    status: '피드백 완료',
    fileType: 'pdf',
    fileUrl: 'https://example.com/uploads/michina3.pdf',
    link: null,
  },
  {
    id: 102,
    title: '브랜딩 키비주얼 제작',
    course: '미치나 8기',
    student: { name: '최가영', email: 'gayeong@example.com' },
    submittedAt: '2025-10-25T10:05:00',
    status: '피드백 완료',
    fileType: 'image',
    fileUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=900&q=80',
    link: null,
  },
  {
    id: 103,
    title: '채널 진단 리포트',
    course: '캔디마 3기',
    student: { name: '정호진', email: 'jinjho@example.com' },
    submittedAt: '2025-11-02T09:10:00',
    status: '제출됨',
    fileType: 'link',
    link: 'https://example.com/share/candima-report',
  },
  {
    id: 104,
    title: '콘텐츠 캘린더 초안',
    course: '캔디수 4기',
    student: { name: '박서연', email: 'seo@example.com' },
    submittedAt: '2025-10-30T18:20:00',
    status: '피드백 완료',
    fileType: 'pdf',
    fileUrl: 'https://example.com/uploads/calendar.pdf',
    link: null,
  },
  {
    id: 105,
    title: '3주차 실습 회고',
    course: '나캔디 원데이',
    student: { name: '홍지민', email: 'hong@example.com' },
    submittedAt: null,
    status: '미제출',
    fileType: 'other',
    link: null,
  },
];

const initialFeedbacks: Feedback[] = [
  {
    id: 501,
    assignmentId: 101,
    course: '미치나 8기',
    student: { name: '이영희', email: 'lee@test.com' },
    content: '전체적인 구성과 색상 밸런스가 훌륭합니다. 다음 회차에서는 CTA 버튼을 더 강조해보세요.',
    author: '김민지',
    createdAt: '2025-10-22T16:10:00',
    classId: null,
  },
  {
    id: 502,
    assignmentId: 102,
    course: '미치나 8기',
    student: { name: '최가영', email: 'gayeong@example.com' },
    content: '브랜드의 톤앤매너가 잘 살아있어요. 다만 모바일에서의 가독성을 한 번 더 점검해주세요.',
    author: '관리자',
    createdAt: '2025-10-26T09:00:00',
    attachmentUrl: 'https://example.com/files/michina-guide.pdf',
    classId: null,
  },
  {
    id: 503,
    assignmentId: 104,
    course: '캔디수 4기',
    student: { name: '박서연', email: 'seo@example.com' },
    content: '캘린더에 타겟 고객 이벤트가 빠져있습니다. 11월 셋째 주에 이벤트 추가를 추천합니다.',
    author: '박성우',
    createdAt: '2025-11-01T12:30:00',
    classId: null,
  },
];

const AdminDataContext = createContext<AdminDataContextValue | undefined>(undefined);

export const AdminDataProvider = ({ children }: { children: ReactNode }) => {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(initialFeedbacks);

  const addFeedback: AdminDataContextValue['addFeedback'] = useCallback(
    ({ assignmentId, content, author, attachmentUrl, classId = null }) => {
      let assignmentForFeedback: Assignment | undefined;

      setAssignments((prevAssignments) => {
        assignmentForFeedback = prevAssignments.find((assignment) => assignment.id === assignmentId);
        if (!assignmentForFeedback) {
          return prevAssignments;
        }

        return prevAssignments.map((assignment) =>
          assignment.id === assignmentId
            ? {
                ...assignment,
                status: '피드백 완료',
              }
            : assignment,
        );
      });

      if (!assignmentForFeedback) {
        return;
      }

      setFeedbacks((prevFeedbacks) => {
        const nextId = prevFeedbacks.length > 0 ? Math.max(...prevFeedbacks.map((feedback) => feedback.id)) + 1 : 1;
        const newFeedback: Feedback = {
          id: nextId,
          assignmentId,
          content,
          author,
          attachmentUrl,
          createdAt: new Date().toISOString(),
          course: assignmentForFeedback!.course,
          student: assignmentForFeedback!.student,
          classId,
        };

        return [...prevFeedbacks, newFeedback];
      });
    },
    [],
  );

  const updateFeedback: AdminDataContextValue['updateFeedback'] = useCallback((feedbackId, updates) => {
    setFeedbacks((prevFeedbacks) =>
      prevFeedbacks.map((feedback) =>
        feedback.id === feedbackId
          ? {
              ...feedback,
              ...updates,
            }
          : feedback,
      ),
    );
  }, []);

  const deleteFeedback: AdminDataContextValue['deleteFeedback'] = useCallback((feedbackId) => {
    let removedFeedback: Feedback | undefined;
    let remainingFeedbacks: Feedback[] = [];

    setFeedbacks((prevFeedbacks) => {
      removedFeedback = prevFeedbacks.find((feedback) => feedback.id === feedbackId);
      remainingFeedbacks = prevFeedbacks.filter((feedback) => feedback.id !== feedbackId);
      return remainingFeedbacks;
    });

    if (!removedFeedback) {
      return;
    }

    setAssignments((prevAssignments) =>
      prevAssignments.map((assignment) => {
        if (assignment.id !== removedFeedback!.assignmentId) {
          return assignment;
        }

        const hasOtherFeedback = remainingFeedbacks.some((feedback) => feedback.assignmentId === assignment.id);
        if (hasOtherFeedback) {
          return assignment;
        }

        return {
          ...assignment,
          status: assignment.status === '피드백 완료' ? '제출됨' : assignment.status,
        };
      }),
    );
  }, []);

  const deleteAssignment: AdminDataContextValue['deleteAssignment'] = useCallback((assignmentId) => {
    setAssignments((prevAssignments) => prevAssignments.filter((assignment) => assignment.id !== assignmentId));

    setFeedbacks((prevFeedbacks) => prevFeedbacks.filter((feedback) => feedback.assignmentId !== assignmentId));
  }, []);

  const batchResetCourse: AdminDataContextValue['batchResetCourse'] = useCallback((course) => {
    setAssignments((prevAssignments) => prevAssignments.filter((assignment) => assignment.course !== course));
    setFeedbacks((prevFeedbacks) => prevFeedbacks.filter((feedback) => feedback.course !== course));
  }, []);

  const value = useMemo<AdminDataContextValue>(
    () => ({ assignments, feedbacks, addFeedback, updateFeedback, deleteFeedback, deleteAssignment, batchResetCourse }),
    [addFeedback, assignments, batchResetCourse, deleteAssignment, deleteFeedback, feedbacks, updateFeedback],
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
};

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData는 AdminDataProvider 안에서만 사용할 수 있습니다.');
  }
  return context;
};
