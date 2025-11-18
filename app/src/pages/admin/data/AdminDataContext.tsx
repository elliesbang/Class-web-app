import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { type AssignmentListItem } from '../../../contexts/SheetsDataContext';
import { useSheetsData } from '../../../contexts/SheetsDataContext';

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
  classId: number | null;
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

const initialAssignments: Assignment[] = [];

const initialFeedbacks: Feedback[] = [];

const AdminDataContext = createContext<AdminDataContextValue | undefined>(undefined);

const normaliseAssignment = (assignment: AssignmentListItem): Assignment => {
  const allowedStatuses: AssignmentStatus[] = ['미제출', '제출됨', '피드백 완료'];
  const allowedFileTypes: AssignmentFileType[] = ['image', 'pdf', 'link', 'other'];

  const status: AssignmentStatus = allowedStatuses.includes(assignment.status)
    ? assignment.status
    : '제출됨';

  const fileType: AssignmentFileType = allowedFileTypes.includes(assignment.fileType)
    ? assignment.fileType
    : assignment.link
      ? 'link'
      : 'other';

  return {
    id: assignment.id,
    title: assignment.title,
    course: assignment.className ?? '미지정 클래스',
    student: {
      name: assignment.studentName || '이름 미입력',
      email: assignment.studentEmail ?? '-',
    },
    submittedAt: assignment.submittedAt || null,
    status,
    fileType,
    classId: typeof assignment.classId === 'number' ? assignment.classId : null,
    fileUrl: assignment.fileUrl ?? undefined,
    link: assignment.link ?? null,
  };
};

export const AdminDataProvider = ({ children }: { children: ReactNode }) => {
  const { assignments: sheetAssignments } = useSheetsData();
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(initialFeedbacks);

  useEffect(() => {
    const normalised = sheetAssignments.map(normaliseAssignment);
    setAssignments(normalised);
  }, [sheetAssignments]);

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
