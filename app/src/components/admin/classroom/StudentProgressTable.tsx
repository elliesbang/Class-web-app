import { useMemo } from 'react';

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
            <tr key={item.student.id} className="hover:bg-[#fdf8f2]">
              <td className="px-6 py-4 font-semibold">{item.student.name}</td>
              <td className="px-6 py-4 text-[#7a6f68]">{item.student.email}</td>
              <td className="px-6 py-4 text-center">{item.completedCount} / {sessions.length}</td>
              <td className="px-6 py-4">
                {item.missingSessions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {item.missingSessions.map((sessionNo) => (
                      <span
                        key={sessionNo}
                        className="rounded-full bg-[#f5eee9] px-3 py-1 text-xs font-semibold text-[#7a6f68]"
                      >
                        세션 {sessionNo}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[#46a758]">없음</span>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                <span
                  className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-bold ${
                    item.isCompleted ? 'bg-[#46a758]/10 text-[#2f7a40]' : 'bg-[#ffd331]/30 text-[#8a6c00]'
                  }`}
                >
                  {item.isCompleted ? '완료' : '진행 중'}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <button
                  type="button"
                  onClick={() => onOpenStudentModal(item.student)}
                  className="rounded-full border border-[#e4d7c6] px-4 py-1 text-xs font-semibold text-[#404040] transition hover:border-[#d6c7b3] hover:bg-[#fdf8f2]"
                >
                  보기
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentProgressTable;
