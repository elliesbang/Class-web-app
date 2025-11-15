import { useEffect, useMemo, useState } from 'react';

type StudentStatus = '수강 중' | '완료' | '중단';

type AssignmentSummary = {
  submitted: number;
  total: number;
};

type FeedbackSummary = {
  completed: number;
  total: number;
};

type StudentAssignment = {
  id: number;
  title: string;
  submittedAt: string;
  feedbackCompleted: boolean;
};

type StudentFeedback = {
  id: number;
  instructor: string;
  summary: string;
  date: string;
};

type StudentContentLink = {
  id: number;
  label: string;
  url: string;
};

type Student = {
  id: number;
  name: string;
  email: string;
  course: string;
  status: StudentStatus;
  assignment: AssignmentSummary;
  feedback: FeedbackSummary;
  registeredDate: string;
  assignments: StudentAssignment[];
  feedbacks: StudentFeedback[];
  contents: StudentContentLink[];
};

type StudentsApiRow = {
  id: number | string;
  name: string;
  email: string;
  class_code?: string | null;
  joined_at?: string | null;
};

type StudentsApiResponse = {
  success?: boolean;
  data?: StudentsApiRow[];
  total?: number;
};

const DEFAULT_COURSE_NAME = '미지정';
const DEFAULT_STATUS: StudentStatus = '수강 중';

let fallbackStudentIdSeed = Date.now();

const ensureNumericId = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  fallbackStudentIdSeed += 1;
  return fallbackStudentIdSeed;
};

const normaliseJoinedAt = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const sanitised = value.replace('T', ' ').replace('Z', '').trim();
  const [datePart] = sanitised.split('.');
  return datePart ?? sanitised;
};

const normaliseCourseName = (value?: string | null) => {
  if (typeof value !== 'string') {
    return DEFAULT_COURSE_NAME;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_COURSE_NAME;
};

const adaptStudentsFromApi = (rows: StudentsApiRow[]): Student[] =>
  rows.map((row) => ({
    id: ensureNumericId(row.id),
    name: typeof row.name === 'string' ? row.name : '',
    email: typeof row.email === 'string' ? row.email : '',
    course: normaliseCourseName(row.class_code),
    status: DEFAULT_STATUS,
    assignment: { submitted: 0, total: 0 },
    feedback: { completed: 0, total: 0 },
    registeredDate: normaliseJoinedAt(row.joined_at),
    assignments: [],
    feedbacks: [],
    contents: [],
  }));

const statusBadgeClassNames: Record<StudentStatus, string> = {
  '수강 중': 'bg-green-100 text-green-700 border border-green-200',
  완료: 'bg-blue-100 text-blue-700 border border-blue-200',
  중단: 'bg-red-100 text-red-700 border border-red-200',
};

 const AdminStudentManagement = () => {
  // TODO: Replace with D1 DB integration and sync with course upload pipeline.
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('전체');
  const [statusFilter, setStatusFilter] = useState<'전체' | StudentStatus>('전체');
  const [showOnlyMissingAssignments, setShowOnlyMissingAssignments] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchStudents = async () => {
      setStudents([]);

      // try {
      //   const response = await fetch('/api/students', { signal: abortController.signal });
      //   if (!response.ok) {
      //     throw new Error(`Failed to fetch students: ${response.status}`);
      //   }
      //
      //   const payload: StudentsApiResponse = await response.json();
      //   if (payload?.success && Array.isArray(payload.data)) {
      //     if (!abortController.signal.aborted) {
      //       setStudents(adaptStudentsFromApi(payload.data));
      //     }
      //   } else if (!abortController.signal.aborted) {
      //     setStudents([]);
      //   }
      // } catch (error) {
      //   if ((error as Error)?.name === 'AbortError') {
      //     return;
      //   }
      //   console.error('[AdminStudentManagement] 수강생 목록을 불러오지 못했습니다.', error);
      //   if (!abortController.signal.aborted) {
      //     setStudents([]);
      //   }
      // }
    };

    fetchStudents();

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (selectedStudentId == null) {
      return;
    }

    const isExistingStudent = students.some((student) => student.id === selectedStudentId);
    if (!isExistingStudent) {
      setSelectedStudentId(null);
    }
  }, [selectedStudentId, students]);

  const courseOptions = useMemo(() => {
    const uniqueCourses = Array.from(new Set(students.map((student) => student.course)));
    return ['전체', ...uniqueCourses];
  }, [students]);

  const filteredStudents = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesKeyword =
        keyword.length === 0 ||
        [student.name, student.email, student.course].some((value) =>
          value.toLowerCase().includes(keyword),
        );

      const matchesCourse = courseFilter === '전체' || student.course === courseFilter;
      const matchesStatus = statusFilter === '전체' || student.status === statusFilter;
      const matchesAssignments =
        !showOnlyMissingAssignments || student.assignment.submitted < student.assignment.total;

      return matchesKeyword && matchesCourse && matchesStatus && matchesAssignments;
    });
  }, [courseFilter, searchTerm, showOnlyMissingAssignments, statusFilter, students]);

  const summaryMetrics = useMemo(() => {
    const targetStudents = filteredStudents;

    if (targetStudents.length === 0) {
      return {
        totalStudents: 0,
        inProgress: 0,
        assignmentRate: 0,
        feedbackRate: 0,
      };
    }

    const totals = targetStudents.reduce(
      (acc, student) => {
        acc.total += 1;
        if (student.status === '수강 중') {
          acc.inProgress += 1;
        }
        acc.assignmentSubmitted += student.assignment.submitted;
        acc.assignmentTotal += student.assignment.total;
        acc.feedbackCompleted += student.feedback.completed;
        acc.feedbackTotal += student.feedback.total;
        return acc;
      },
      {
        total: 0,
        inProgress: 0,
        assignmentSubmitted: 0,
        assignmentTotal: 0,
        feedbackCompleted: 0,
        feedbackTotal: 0,
      },
    );

    const assignmentRate =
      totals.assignmentTotal === 0 ? 0 : Math.round((totals.assignmentSubmitted / totals.assignmentTotal) * 100);
    const feedbackRate =
      totals.feedbackTotal === 0 ? 0 : Math.round((totals.feedbackCompleted / totals.feedbackTotal) * 100);

    return {
      totalStudents: totals.total,
      inProgress: totals.inProgress,
      assignmentRate,
      feedbackRate,
    };
  }, [filteredStudents]);

  const selectedStudent = useMemo(
    () => (selectedStudentId == null ? null : students.find((student) => student.id === selectedStudentId) ?? null),
    [selectedStudentId, students],
  );

  const closeModal = () => setSelectedStudentId(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-20 -mx-6 mb-2 bg-white px-6 py-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-bold text-[#404040]">수강생 관리</h1>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="이름, 이메일, 수업명을 검색하세요"
                className="w-full rounded-full border border-[#e9dccf] bg-white py-2 pl-10 pr-4 text-sm text-[#404040] shadow-sm focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-full border border-[#e9dccf] bg-white px-4 py-2 text-sm text-[#404040] shadow-sm focus:border-[#ffd331] focus:outline-none"
                value={courseFilter}
                onChange={(event) => setCourseFilter(event.target.value)}
              >
                {courseOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                className="rounded-full border border-[#e9dccf] bg-white px-4 py-2 text-sm text-[#404040] shadow-sm focus:border-[#ffd331] focus:outline-none"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              >
                {['전체', '수강 중', '완료', '중단'].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowOnlyMissingAssignments((prev) => !prev)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all hover:shadow-lg ${
                  showOnlyMissingAssignments
                    ? 'border-[#ffd331] bg-[#ffd331]/90 text-[#404040]'
                    : 'border-[#e9dccf] bg-white text-[#5c5c5c]'
                }`}
              >
                🚫 과제 미제출자
              </button>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl bg-white p-4 shadow-md transition-all hover:shadow-lg">
            <p className="text-sm text-[#5c5c5c]">전체 수강생 수</p>
            <p className="mt-2 text-2xl font-bold text-[#ffd331]">{summaryMetrics.totalStudents.toLocaleString()}명</p>
          </article>
          <article className="rounded-xl bg-white p-4 shadow-md transition-all hover:shadow-lg">
            <p className="text-sm text-[#5c5c5c]">현재 수강 중</p>
            <p className="mt-2 text-2xl font-bold text-[#ffd331]">{summaryMetrics.inProgress.toLocaleString()}명</p>
          </article>
          <article className="rounded-xl bg-white p-4 shadow-md transition-all hover:shadow-lg">
            <p className="text-sm text-[#5c5c5c]">과제 제출률</p>
            <p className="mt-2 text-2xl font-bold text-[#ffd331]">{summaryMetrics.assignmentRate}%</p>
          </article>
          <article className="rounded-xl bg-white p-4 shadow-md transition-all hover:shadow-lg">
            <p className="text-sm text-[#5c5c5c]">피드백 완료율</p>
            <p className="mt-2 text-2xl font-bold text-[#ffd331]">{summaryMetrics.feedbackRate}%</p>
          </article>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="hidden overflow-hidden rounded-2xl bg-white shadow-md md:block">
          <table className="min-w-full table-auto">
            <thead className="bg-[#f5eee9] text-left text-sm text-[#5c5c5c]">
              <tr>
                <th className="px-6 py-4 font-semibold">이름</th>
                <th className="px-6 py-4 font-semibold">이메일</th>
                <th className="px-6 py-4 font-semibold">수업명</th>
                <th className="px-6 py-4 font-semibold">상태</th>
                <th className="px-6 py-4 font-semibold">과제 제출</th>
                <th className="px-6 py-4 font-semibold">피드백</th>
                <th className="px-6 py-4 font-semibold">등록일</th>
                <th className="px-6 py-4 font-semibold">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-[#5c5c5c]">
                    조건에 맞는 수강생이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="border-t border-[#f0e2d7] text-sm text-[#404040]">
                    <td className="px-6 py-4 font-semibold">{student.name}</td>
                    <td className="px-6 py-4">{student.email}</td>
                    <td className="px-6 py-4">{student.course}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClassNames[student.status]}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#404040]">
                        {student.assignment.submitted}/{student.assignment.total}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#404040]">
                        {student.feedback.completed}/{student.feedback.total}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#5c5c5c]">{student.registeredDate}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentId(student.id)}
                        className="inline-flex items-center gap-1 rounded-full bg-[#ffd331] px-4 py-2 text-xs font-semibold text-[#404040] shadow-md transition-all hover:bg-[#e6bd2c] hover:shadow-lg"
                      >
                        🔍 상세보기
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 md:hidden">
          {filteredStudents.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-[#5c5c5c] shadow-md">
              조건에 맞는 수강생이 없습니다.
            </div>
          ) : (
            filteredStudents.map((student) => (
              <article
                key={student.id}
                className="rounded-2xl bg-white p-5 shadow-md transition-all hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#404040]">{student.name}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClassNames[student.status]}`}>
                    {student.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#5c5c5c]">{student.email}</p>
                <p className="mt-1 text-sm font-medium text-[#404040]">{student.course}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#404040]">
                  <span className="rounded-full bg-[#f5eee9] px-3 py-1 font-semibold">
                    과제 {student.assignment.submitted}/{student.assignment.total}
                  </span>
                  <span className="rounded-full bg-[#f5eee9] px-3 py-1 font-semibold">
                    피드백 {student.feedback.completed}/{student.feedback.total}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-[#5c5c5c]">
                  <span>등록일 {student.registeredDate}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentId(student.id)}
                    className="rounded-full bg-[#ffd331] px-4 py-2 text-xs font-semibold text-[#404040] shadow-md transition-all hover:bg-[#e6bd2c] hover:shadow-lg"
                  >
                    🔍 상세보기
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {selectedStudent && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-full bg-[#f5eee9] px-3 py-1 text-sm font-semibold text-[#404040] shadow-sm hover:shadow-md"
            >
              닫기
            </button>
            <h2 className="pr-16 text-2xl font-bold text-[#404040]">{selectedStudent.name}</h2>
            <p className="mt-1 text-sm text-[#5c5c5c]">{selectedStudent.email}</p>

            <div className="mt-4 grid gap-3 rounded-2xl bg-[#f5eee9] p-4 text-sm text-[#404040] md:grid-cols-2">
              <div>
                <p className="font-semibold">등록 수업명</p>
                <p>{selectedStudent.course}</p>
              </div>
              <div>
                <p className="font-semibold">상태</p>
                <p>{selectedStudent.status}</p>
              </div>
              <div>
                <p className="font-semibold">등록일</p>
                <p>{selectedStudent.registeredDate}</p>
              </div>
              <div>
                <p className="font-semibold">과제 / 피드백</p>
                <p>
                  {selectedStudent.assignment.submitted}/{selectedStudent.assignment.total} · {selectedStudent.feedback.completed}/
                  {selectedStudent.feedback.total}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <section className="rounded-2xl border border-[#f0e2d7] bg-white p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-[#404040]">🎥 제출한 과제</h3>
                <ul className="mt-3 space-y-3 text-sm text-[#404040]">
                  {selectedStudent.assignments.length === 0 ? (
                    <li className="rounded-xl bg-[#f5eee9] px-3 py-2 text-[#5c5c5c]">제출한 과제가 없습니다.</li>
                  ) : (
                    selectedStudent.assignments.map((assignment) => (
                      <li key={assignment.id} className="rounded-xl bg-[#f5eee9] px-3 py-2">
                        <p className="font-semibold">{assignment.title}</p>
                        <p className="mt-1 text-xs text-[#5c5c5c]">제출일 {assignment.submittedAt}</p>
                        <p className="mt-1 text-xs font-semibold text-[#404040]">
                          {assignment.feedbackCompleted ? '피드백 완료' : '피드백 대기'}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              </section>

              <section className="rounded-2xl border border-[#f0e2d7] bg-white p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-[#404040]">💬 받은 피드백</h3>
                <ul className="mt-3 space-y-3 text-sm text-[#404040]">
                  {selectedStudent.feedbacks.length === 0 ? (
                    <li className="rounded-xl bg-[#f5eee9] px-3 py-2 text-[#5c5c5c]">피드백이 아직 없습니다.</li>
                  ) : (
                    selectedStudent.feedbacks.map((feedback) => (
                      <li key={feedback.id} className="rounded-xl bg-[#f5eee9] px-3 py-2">
                        <p className="font-semibold">{feedback.instructor}</p>
                        <p className="mt-1 text-sm">{feedback.summary}</p>
                        <p className="mt-1 text-xs text-[#5c5c5c]">{feedback.date}</p>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </div>

            <section className="mt-6 rounded-2xl border border-[#f0e2d7] bg-white p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-[#404040]">📚 관련 콘텐츠</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedStudent.contents.map((content) => (
                  <a
                    key={content.id}
                    href={content.url}
                    className="rounded-full border border-[#ffd331] bg-[#ffd331]/20 px-4 py-2 text-xs font-semibold text-[#404040] transition-all hover:bg-[#ffd331]/40"
                  >
                    {content.label}
                  </a>
                ))}
              </div>
            </section>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-full border border-[#ffd331] px-4 py-2 text-sm font-semibold text-[#404040] transition-all hover:bg-[#ffd331]/20 hover:shadow-md"
              >
                피드백 작성
              </button>
              <button
                type="button"
                className="rounded-full bg-[#ffd331] px-4 py-2 text-sm font-semibold text-[#404040] shadow-md transition-all hover:bg-[#e6bd2c] hover:shadow-lg"
              >
                수강 상태 변경
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
 };

 export default AdminStudentManagement;
