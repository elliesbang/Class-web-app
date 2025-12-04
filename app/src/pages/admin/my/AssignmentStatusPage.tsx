import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuthUser } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

type ClassRow = {
  id: string | number;
  name?: string | null;
  code?: string | null;
  total_sessions?: number | null;
};

type AssignmentRow = {
  id: string | number;
  title?: string | null;
  classroom_id?: string | number | null;
};

type SubmissionRow = {
  id: string | number;
  assignment_id?: string | number | null;
  student_id?: string | null;
  created_at?: string | null;
};

type StudentProfile = {
  id: string;
  name?: string | null;
  email?: string | null;
};

const isMichinaClass = (classItem: ClassRow | null) => {
  if (!classItem) return false;
  const target = `${classItem.name ?? ''} ${classItem.code ?? ''}`.toLowerCase();
  return target.includes('미치나') || target.includes('michina');
};

const AssignmentStatusPage = () => {
  const { user: authUser } = useAuthUser();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'admin') {
      navigate('/my');
    }
  }, [authUser, navigate]);

  const selectedClass = useMemo(
    () => classes.find((classItem) => String(classItem.id) === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  const totalSessions = useMemo(() => {
    if (selectedClass?.total_sessions && selectedClass.total_sessions > 0) {
      return selectedClass.total_sessions;
    }
    return isMichinaClass(selectedClass) ? 21 : undefined;
  }, [selectedClass]);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      setError(null);
      const { data, error: classError } = await supabase.from('classes').select('id, name, code, total_sessions');
      if (classError) {
        setError(classError.message);
        setClasses([]);
        setLoading(false);
        return;
      }

      const classData = data ?? [];
      setClasses(classData);
      setSelectedClassId((prev) => prev || (classData[0]?.id ? String(classData[0].id) : ''));
      setLoading(false);
    };

    void fetchClasses();
  }, []);

  useEffect(() => {
    const fetchAssignmentData = async () => {
      if (!selectedClassId) {
        setAssignments([]);
        setSubmissions([]);
        setStudents([]);
        return;
      }

      setLoading(true);
      setError(null);

      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select('id, title, classroom_id')
        .eq('classroom_id', selectedClassId);

      if (assignmentError) {
        setError(assignmentError.message);
        setAssignments([]);
        setSubmissions([]);
        setStudents([]);
        setLoading(false);
        return;
      }

      const assignmentIds = (assignmentData ?? []).map((assignment) => assignment.id);
      const { data: submissionData, error: submissionError } = assignmentIds.length
        ? await supabase
            .from('assignment_submissions')
            .select('id, assignment_id, student_id, created_at')
            .in('assignment_id', assignmentIds)
        : { data: [], error: null };

      if (submissionError) {
        setError(submissionError.message);
        setAssignments(assignmentData ?? []);
        setSubmissions([]);
        setStudents([]);
        setLoading(false);
        return;
      }

      const submissionStudentIds = new Set<string>();
      (submissionData ?? []).forEach((submission) => {
        if (submission.student_id) {
          submissionStudentIds.add(submission.student_id);
        }
      });

      let studentProfiles: StudentProfile[] = [];

      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('class_students')
        .select('student_id, profiles ( id, name, email )')
        .eq('classroom_id', selectedClassId);

      if (!enrollmentError && enrollmentData) {
        studentProfiles = enrollmentData
          .map((row) => row.profiles)
          .filter(Boolean) as StudentProfile[];
      } else if (submissionStudentIds.size > 0) {
        const { data: fallbackProfiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', Array.from(submissionStudentIds));
        studentProfiles = fallbackProfiles ?? [];
      } else {
        const { data: fallbackStudents } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('role', 'student');
        studentProfiles = fallbackStudents ?? [];
      }

      setAssignments(assignmentData ?? []);
      setSubmissions(submissionData ?? []);
      setStudents(studentProfiles);
      setLoading(false);
    };

    void fetchAssignmentData();
  }, [selectedClassId]);

  if (!authUser || authUser.role !== 'admin') {
    return null;
  }

  const submissionMap = new Map<string, SubmissionRow[]>();
  submissions.forEach((submission) => {
    const studentId = submission.student_id ? String(submission.student_id) : '';
    if (!studentId) return;
    const list = submissionMap.get(studentId) ?? [];
    list.push(submission);
    submissionMap.set(studentId, list);
  });

  const submittedStudents = students.filter((student) => submissionMap.has(student.id));
  const pendingStudents = students.filter((student) => !submissionMap.has(student.id));

  const completers = totalSessions
    ? students.filter((student) => (submissionMap.get(student.id)?.length ?? 0) >= totalSessions)
    : [];

  return (
    <div className="space-y-5 p-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold">과제 제출 현황</h1>
        <p className="text-sm text-[#6b625c]">수업별 제출자, 미제출자, 완주자를 확인하세요.</p>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 shadow-inner">{error}</div>
      ) : null}

      <div className="rounded-2xl bg-white px-4 py-3 shadow-soft">
        <label className="text-sm font-semibold text-[#404040]" htmlFor="class-select">
          수업 선택
        </label>
        <select
          id="class-select"
          className="mt-2 w-full rounded-xl border border-[#e5d4a2] px-3 py-2 text-sm"
          value={selectedClassId}
          onChange={(event) => setSelectedClassId(event.target.value)}
        >
          {classes.map((classItem) => (
            <option key={classItem.id} value={classItem.id}>
              {classItem.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white px-4 py-5 text-sm text-[#6b625c] shadow-soft">불러오는 중입니다...</div>
      ) : (
        <div className="space-y-4">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1f5139]">제출한 사람</h2>
              <span className="rounded-full bg-[#e9f7ef] px-3 py-1 text-xs font-semibold text-[#1f5139]">
                {submittedStudents.length}명
              </span>
            </div>

            {submittedStudents.length === 0 ? (
              <p className="rounded-2xl bg-white px-4 py-3 text-sm text-[#6b625c] shadow-soft">아직 제출자가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {submittedStudents.map((student) => (
                  <div key={student.id} className="rounded-2xl bg-[#e9f7ef] px-4 py-3 text-sm text-[#1f5139] shadow-soft">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{student.name || '이름 없음'}</p>
                        <p className="text-xs text-[#3c6e58]">{student.email || student.id}</p>
                        <p className="text-xs text-[#3c6e58]">
                          제출 {submissionMap.get(student.id)?.length ?? 0}회
                          {totalSessions ? ` / 목표 ${totalSessions}회` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/classroom/${selectedClassId}/feedback`}
                          className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#1f5139] shadow"
                        >
                          피드백 하기
                        </Link>
                        <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-[#1f5139]">
                          최근 제출: {
                            submissionMap
                              .get(student.id)
                              ?.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
                              .slice(-1)[0]?.created_at?.slice(0, 10) ?? '정보 없음'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#5c5246]">미제출자</h2>
              <span className="rounded-full bg-[#f3f1ef] px-3 py-1 text-xs font-semibold text-[#5c5246]">
                {pendingStudents.length}명
              </span>
            </div>

            {pendingStudents.length === 0 ? (
              <p className="rounded-2xl bg-white px-4 py-3 text-sm text-[#6b625c] shadow-soft">미제출자가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {pendingStudents.map((student) => (
                  <div key={student.id} className="rounded-2xl bg-[#f3f1ef] px-4 py-3 text-sm text-[#5c5246] shadow-soft">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{student.name || '이름 없음'}</p>
                        <p className="text-xs text-[#6b625c]">{student.email || student.id}</p>
                      </div>
                      <Link
                        to={`/classroom/${selectedClassId}/feedback`}
                        className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#5c5246] shadow"
                      >
                        피드백 하기
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#2c3e50]">완주자 리스트</h2>
              <span className="rounded-full bg-[#dceafe] px-3 py-1 text-xs font-semibold text-[#2c3e50]">
                {completers.length}명
              </span>
            </div>
            {totalSessions ? (
              <p className="text-xs text-[#2c3e50]">총 {totalSessions}회 기준으로 완주 여부를 계산합니다.</p>
            ) : (
              <p className="text-xs text-[#2c3e50]">완주 기준을 설정할 수 없어 제출 횟수만 표시합니다.</p>
            )}

            {completers.length === 0 ? (
              <p className="rounded-2xl bg-white px-4 py-3 text-sm text-[#6b625c] shadow-soft">완주자가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {completers.map((student) => (
                  <div key={student.id} className="rounded-2xl bg-[#dceafe] px-4 py-3 text-sm text-[#1f2f3d] shadow-soft">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{student.name || '이름 없음'}</p>
                        <p className="text-xs text-[#1f2f3d]">{student.email || student.id}</p>
                        <p className="text-xs text-[#1f2f3d]">제출 {submissionMap.get(student.id)?.length ?? 0}회</p>
                      </div>
                      <Link
                        to={`/classroom/${selectedClassId}/feedback`}
                        className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#1f2f3d] shadow"
                      >
                        피드백 이동
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default AssignmentStatusPage;
