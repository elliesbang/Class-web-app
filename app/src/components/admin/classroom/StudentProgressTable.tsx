import { useMemo } from 'react';
import StudentProgressRow from './StudentProgressRow';

export type Student = {
  id: string;
  name: string;
  email: string;
};

export type Submission = {
  student_id: string;
  session_no: number;
  assignment_id: number;
};

export type StudentProgress = {
  student: Student;
  completedCount: number;
  missingSessions: number[];
  isCompleted: boolean;
};

type StudentProgressTableProps = {
  students: Student[];
  submissions: Submission[];
  sessions: number[];
  onOpenStudentModal: (student: Student) => void;
};

const StudentProgressTable = ({
  students,
  submissions,
  sessions,
  onOpenStudentModal,
}: StudentProgressTableProps) => {
  const studentProgressList: StudentProgress[] = useMemo(
    () =>
      students.map((student) => {
        const studentSubmissions = submissions.filter((item) => item.student_id === student.id);
        const completedSessions = new Set(studentSubmissions.map((item) => item.session_no));
        const completedCount = completedSessions.size;
        const missingSessions = sessions.filter((session) => !completedSessions.has(session));

        return {
          student,
          completedCount,
          missingSessions,
          isCompleted: completedCount === sessions.length && sessions.length > 0,
        };
      }),
    [sessions, students, submissions],
  );

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
      <table className="min-w-full divide-y divide-[#f1e7dd] text-sm text-[#404040]">
        <thead className="bg-[#fdf8f2]">
          <tr>
            <th className="px-6 py-4 text-left font-semibold">학생</th>
            <th className="px-6 py-4 text-left font-semibold">이메일</th>
            <th className="px-6 py-4 text-center font-semibold">완료 세션</th>
            <th className="px-6 py-4 text-left font-semibold">미제출 세션</th>
            <th className="px-6 py-4 text-center font-semibold">상태</th>
            <th className="px-6 py-4 text-center font-semibold">자세히</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1e7dd]">
          {studentProgressList.map((item) => (
            <StudentProgressRow
              key={item.student.id}
              student={item.student}
              completedCount={item.completedCount}
              missingSessions={item.missingSessions}
              totalSessions={sessions.length}
              onOpen={() => onOpenStudentModal(item.student)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentProgressTable;
