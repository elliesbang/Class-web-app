import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import LoadingSpinner from '@/components/LoadingSpinner';

type Student = {
  id: string;
  name: string;
  email: string;
};

type Submission = {
  student_id: string;
  session_no: number;
  assignment_id: number;
};

type ProgressResponse = {
  students: Student[];
  sessions: number[];
  submissions: Submission[];
};

type StudentProgress = {
  student: Student;
  completedCount: number;
  missingSessions: number[];
  isCompleted: boolean;
};

const StudentProgressTable = ({
  students,
  sessions,
  submissions,
}: {
  students: Student[];
  sessions: number[];
  submissions: Submission[];
}) => {
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
          isCompleted: completedCount === sessions.length,
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
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1e7dd]">
          {studentProgressList.map((item) => (
            <tr key={item.student.id} className="hover:bg-[#fdf8f2]">
              <td className="px-6 py-4 font-semibold">{item.student.name}</td>
              <td className="px-6 py-4 text-[#7a6f68]">{item.student.email}</td>
              <td className="px-6 py-4 text-center">{item.completedCount}</td>
              <td className="px-6 py-4">
                {item.missingSessions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {item.missingSessions.map((sessionNo) => (
                      <span key={sessionNo} className="rounded-full bg-[#f5eee9] px-3 py-1 text-xs font-semibold text-[#7a6f68]">
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AssignmentFeedbackDashboard = () => {
  const { class_id: classId } = useParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<number[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;

    let isMounted = true;

    const fetchProgress = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin-assignments-progress?class_id=${classId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch progress data');
        }

        const data: ProgressResponse = await response.json();
        if (!isMounted) return;

        setStudents(data.students ?? []);
        setSessions(data.sessions ?? []);
        setSubmissions(data.submissions ?? []);
      } catch (err) {
        if (!isMounted) return;
        console.error('[AssignmentFeedbackDashboard] failed to load progress', err);
        setError('진행 현황을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        setStudents([]);
        setSessions([]);
        setSubmissions([]);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    void fetchProgress();

    return () => {
      isMounted = false;
    };
  }, [classId]);

  const totalSessions = sessions.length;
  const studentProgressList = useMemo<StudentProgress[]>(
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

  const completedStudents = studentProgressList.filter((item) => item.isCompleted).length;
  const totalStudents = students.length;
  const classroomCompletionRate = totalStudents === 0 ? 0 : (completedStudents / totalStudents) * 100;

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#7a6f68]">강의실 ID</p>
              <h1 className="text-2xl font-bold text-[#404040]">{classId ?? '미지정'}</h1>
            </div>
            <div className="rounded-2xl bg-[#fdf8f2] px-4 py-3 text-right">
              <p className="text-xs font-semibold text-[#7a6f68]">클래스 완료율</p>
              <p className="text-3xl font-bold text-[#404040]">{classroomCompletionRate.toFixed(1)}%</p>
              <p className="text-xs text-[#7a6f68]">
                완료 학생 {completedStudents}명 / 총 {totalStudents}명 · 세션 {totalSessions}개
              </p>
            </div>
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <StudentProgressTable students={students} submissions={submissions} sessions={sessions} />
      )}
    </div>
  );
};

export default AssignmentFeedbackDashboard;
