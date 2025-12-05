import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import LoadingSpinner from '@/components/LoadingSpinner';
import StudentProgressTable, {
  Student,
  Submission,
  StudentProgress,
} from '@/components/admin/classroom/StudentProgressTable';

type ProgressResponse = {
  students: Student[];
  sessions: number[];
  submissions: Submission[];
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

  const handleOpenStudentModal = (student: Student) => {
    console.log('[AssignmentFeedbackDashboard] open student modal', student);
  };

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
        <StudentProgressTable
          students={students}
          submissions={submissions}
          sessions={sessions}
          onOpenStudentModal={handleOpenStudentModal}
        />
      )}
    </div>
  );
};

export default AssignmentFeedbackDashboard;
