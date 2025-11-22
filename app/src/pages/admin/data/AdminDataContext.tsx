import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export type AssignmentStatus = '미제출' | '제출됨' | '피드백 완료'
export type AssignmentFileType = 'image' | 'pdf' | 'link' | 'other'

type StudentInfo = {
  name: string
  email: string
}

export type Assignment = {
  id: number
  title: string
  course: string
  student: StudentInfo
  submittedAt: string | null
  status: AssignmentStatus
  fileType: AssignmentFileType
  classId: number | null
  fileUrl?: string
  link?: string | null
}

export type Feedback = {
  id: number
  assignmentId: number
  course: string
  student: StudentInfo
  content: string
  author: string
  createdAt: string
  attachmentUrl?: string
  classId: number | null
}

type AdminDataContextValue = {
  assignments: Assignment[]
  feedbacks: Feedback[]
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

export const AdminDataProvider = ({ children }: { children: ReactNode }) => {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(initialFeedbacks);

  const addFeedback: AdminDataContextValue['addFeedback'] = useCallback(
    ({ assignmentId, content, author, attachmentUrl, classId = null }) => {
      let assignmentForFeedback: Assignment | undefined

      setAssignments((prevAssignments) => {
        assignmentForFeedback = prevAssignments.find((assignment) => assignment.id === assignmentId)
        if (!assignmentForFeedback) {
          return prevAssignments
        }

        return prevAssignments.map((assignment) =>
          assignment.id === assignmentId
            ? {
                ...assignment,
                status: '피드백 완료',
              }
            : assignment,
        )
      })

      if (!assignmentForFeedback) {
        return
      }

      setFeedbacks((prevFeedbacks) => {
        const nextId = prevFeedbacks.length > 0 ? Math.max(...prevFeedbacks.map((feedback) => feedback.id)) + 1 : 1
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
        }

        return [...prevFeedbacks, newFeedback]
      })
    },
    [],
  )

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
    )
  }, [])

  const deleteFeedback: AdminDataContextValue['deleteFeedback'] = useCallback((feedbackId) => {
    let removedFeedback: Feedback | undefined
    let remainingFeedbacks: Feedback[] = []

    setFeedbacks((prevFeedbacks) => {
      removedFeedback = prevFeedbacks.find((feedback) => feedback.id === feedbackId)
      remainingFeedbacks = prevFeedbacks.filter((feedback) => feedback.id !== feedbackId)
      return remainingFeedbacks
    })

    if (!removedFeedback) {
      return
    }

    setAssignments((prevAssignments) =>
      prevAssignments.map((assignment) => {
        if (assignment.id !== removedFeedback!.assignmentId) {
          return assignment
        }

        const hasOtherFeedback = remainingFeedbacks.some((feedback) => feedback.assignmentId === assignment.id)
        if (hasOtherFeedback) {
          return assignment
        }

        return {
          ...assignment,
          status: assignment.status === '피드백 완료' ? '제출됨' : assignment.status,
        }
      }),
    )
  }, [])

  const deleteAssignment: AdminDataContextValue['deleteAssignment'] = useCallback((assignmentId) => {
    setAssignments((prevAssignments) => prevAssignments.filter((assignment) => assignment.id !== assignmentId))

    setFeedbacks((prevFeedbacks) => prevFeedbacks.filter((feedback) => feedback.assignmentId !== assignmentId))
  }, [])

  const batchResetCourse: AdminDataContextValue['batchResetCourse'] = useCallback((course) => {
    setAssignments((prevAssignments) => prevAssignments.filter((assignment) => assignment.course !== course))
    setFeedbacks((prevFeedbacks) => prevFeedbacks.filter((feedback) => feedback.course !== course))
  }, [])

  return useMemo<AdminDataContextValue>(
    () => ({ assignments, feedbacks, addFeedback, updateFeedback, deleteFeedback, deleteAssignment, batchResetCourse }),
    [addFeedback, assignments, batchResetCourse, deleteAssignment, deleteFeedback, feedbacks, updateFeedback],
  )
}

export const AdminDataProvider = ({ children }: { children: ReactNode }) => {
  const value = useAdminState()

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
}

export const useAdminData = () => {
  const context = useContext(AdminDataContext)
  const fallbackValue = useAdminState()
  return context ?? fallbackValue
}
