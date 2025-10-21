import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CourseResetModal from '../../components/admin/CourseResetModal';
import AdminModal from '../../components/admin/AdminModal';
import Toast, { type ToastVariant } from '../../components/admin/Toast';
import { useAdminData, type Assignment, type AssignmentStatus } from './data/AdminDataContext';

const statusBadgeClassName: Record<AssignmentStatus, string> = {
  미제출: 'bg-[#fff5f5] text-[#c43c3c] border border-[#ffd1d1]',
  제출됨: 'bg-[#fff8e6] text-[#b97a00] border border-[#ffe2a8]',
  '피드백 완료': 'bg-[#e8f8f0] text-[#17853a] border border-[#bfead2]',
};

type ToastState = {
  message: string;
  variant?: ToastVariant;
};

const AssignmentPreviewModal = ({ assignment, onClose }: { assignment: Assignment; onClose: () => void }) => {
  const renderPreview = () => {
    if (assignment.fileType === 'image' && assignment.fileUrl) {
      return (
        <img
          src={assignment.fileUrl}
          alt={`${assignment.title} 제출물 미리보기`}
          className="h-full max-h-[500px] w-full rounded-xl object-contain"
        />
      );
    }

    if (assignment.fileType === 'pdf' && assignment.fileUrl) {
      return <iframe src={assignment.fileUrl} title={assignment.title} className="h-[500px] w-full rounded-xl"></iframe>;
    }

    if (assignment.fileType === 'link' && assignment.link) {
      return (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#f5eee9] p-6 text-center text-sm text-[#404040]">
          <p className="font-semibold">링크 제출물은 새 탭에서 확인됩니다.</p>
          <a
            href={assignment.link}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-[#ffd331] px-4 py-2 font-semibold text-[#404040] shadow hover:bg-[#e6bd2c]"
          >
            새 탭에서 열기
          </a>
        </div>
      );
    }

    if (assignment.fileUrl) {
      return (
        <div className="rounded-2xl bg-[#f5eee9] p-4 text-sm text-[#404040]">
          해당 파일 형식은 내장 미리보기를 지원하지 않습니다. 다운로드 후 확인해주세요.
        </div>
      );
    }

    return (
      <div className="rounded-2xl bg-[#f5eee9] p-4 text-sm text-[#404040]">제출된 파일이 없어 미리보기 할 수 없습니다.</div>
    );
  };

  return (
    <AdminModal
      title="과제 미리보기"
      subtitle={`${assignment.title} · ${assignment.student.name}`}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="grid gap-2 rounded-2xl bg-[#fdf8f2] p-4 text-sm text-[#404040]">
          <div className="flex flex-wrap justify-between gap-3">
            <span className="font-semibold">수업명</span>
            <span>{assignment.course}</span>
          </div>
          <div className="flex flex-wrap justify-between gap-3">
            <span className="font-semibold">수강생</span>
            <span>
              {assignment.student.name} · {assignment.student.email}
            </span>
          </div>
          <div className="flex flex-wrap justify-between gap-3">
            <span className="font-semibold">제출일</span>
            <span>{assignment.submittedAt ? new Date(assignment.submittedAt).toLocaleString() : '-'}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-inner">{renderPreview()}</div>
      </div>
    </AdminModal>
  );
};

const AdminAssignmentsManagement = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const { assignments, feedbacks, deleteAssignment, batchResetCourse } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('전체');
  const [statusFilter, setStatusFilter] = useState<'전체' | '미제출' | '제출됨' | '피드백 완료'>('전체');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetCourse, setResetCourse] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const courses = useMemo(() => Array.from(new Set(assignments.map((assignment) => assignment.course))), [assignments]);

  const filteredAssignments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const matchesKeyword =
        keyword.length === 0 ||
        [assignment.title, assignment.course, assignment.student.name, assignment.student.email].some((value) =>
          value.toLowerCase().includes(keyword),
        );

      const matchesCourse = courseFilter === '전체' || assignment.course === courseFilter;
      const matchesStatus = statusFilter === '전체' || assignment.status === statusFilter;

      return matchesKeyword && matchesCourse && matchesStatus;
    });
  }, [assignments, courseFilter, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = assignments.length;
    const submitted = assignments.filter((assignment) => assignment.status !== '미제출').length;
    const feedbackCompleted = assignments.filter((assignment) => assignment.status === '피드백 완료').length;
    const completionRate = submitted === 0 ? 0 : Math.round((feedbackCompleted / submitted) * 100);

    return {
      total,
      submitted,
      feedbackCompleted,
      completionRate,
    };
  }, [assignments]);

  useEffect(() => {
    if (id) {
      const targetAssignment = assignments.find((assignment) => assignment.id === Number(id));
      if (targetAssignment) {
        if (targetAssignment.fileType === 'link' && targetAssignment.link) {
          window.open(targetAssignment.link, '_blank');
          setToast({ message: '링크 제출물이 새 탭에서 열렸습니다.', variant: 'info' });
          navigate('/admin/assignments', { replace: true });
          return;
        }
        setSelectedAssignment(targetAssignment);
      } else {
        navigate('/admin/assignments', { replace: true });
      }
    }
  }, [assignments, id, navigate]);

  useEffect(() => {
    const assignmentIdFromQuery = searchParams.get('assignmentId');
    if (assignmentIdFromQuery) {
      const targetAssignment = assignments.find((assignment) => assignment.id === Number(assignmentIdFromQuery));
      if (targetAssignment) {
        if (targetAssignment.fileType === 'link' && targetAssignment.link) {
          window.open(targetAssignment.link, '_blank');
          setToast({ message: '링크 제출물이 새 탭에서 열렸습니다.', variant: 'info' });
        } else {
          setSelectedAssignment(targetAssignment);
        }
      }
    }
  }, [assignments, searchParams]);

  const handlePreview = (assignment: Assignment) => {
    if (assignment.fileType === 'link' && assignment.link) {
      window.open(assignment.link, '_blank');
      setToast({ message: '링크 제출물이 새 탭에서 열렸습니다.', variant: 'info' });
      return;
    }
    setSelectedAssignment(assignment);
  };

  const handleDelete = (assignmentId: number) => {
    if (window.confirm('해당 과제와 연결된 피드백을 모두 삭제하시겠습니까?')) {
      deleteAssignment(assignmentId);
      setToast({ message: '과제가 삭제되었습니다.', variant: 'success' });
    }
  };

  const handleResetConfirm = () => {
    if (resetCourse) {
      batchResetCourse(resetCourse);
      setToast({ message: `‘${resetCourse}’의 과제와 피드백이 모두 초기화되었습니다.`, variant: 'success' });
    }
    setIsResetModalOpen(false);
    setResetCourse(null);
  };

  const closePreview = () => {
    setSelectedAssignment(null);
    if (id) {
      navigate('/admin/assignments', { replace: true });
    }
  };

  const feedbackExists = (assignmentId: number) => feedbacks.some((feedback) => feedback.assignmentId === assignmentId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#404040]">과제 관리</h2>
          <p className="text-sm text-[#7a6f68]">수강생이 제출한 과제를 확인하고 피드백을 바로 연결하세요.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="수강생 이름, 이메일 또는 수업명을 검색하세요"
              className="w-64 rounded-2xl border border-[#e9dccf] bg-white px-4 py-2 text-sm text-[#404040] placeholder:text-[#b0a79f] focus:border-[#ffd331] focus:outline-none"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#b0a79f]">🔍</span>
          </div>

          <select
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
            className="rounded-2xl border border-[#e9dccf] bg-white px-3 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none"
          >
            <option value="전체">전체 수업</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="rounded-2xl border border-[#e9dccf] bg-white px-3 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none"
          >
            <option value="전체">전체 상태</option>
            <option value="미제출">미제출</option>
            <option value="제출됨">제출됨</option>
            <option value="피드백 완료">피드백 완료</option>
          </select>

          <button
            type="button"
            className="rounded-2xl bg-[#ff5f5f] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#e94b4b]"
            onClick={() => setIsResetModalOpen(true)}
          >
            ⚙️ 기수별 초기화
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-[#7a6f68]">전체 과제 수</p>
          <p className="mt-2 text-2xl font-bold text-[#404040]">{stats.total.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-[#7a6f68]">제출 완료</p>
          <p className="mt-2 text-2xl font-bold text-[#404040]">{stats.submitted.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-[#7a6f68]">피드백 완료</p>
          <p className="mt-2 text-2xl font-bold text-[#404040]">{stats.feedbackCompleted.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-[#7a6f68]">완료율</p>
          <p className="mt-2 text-2xl font-bold text-[#404040]">{stats.completionRate}%</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm text-[#404040]">
            <thead>
              <tr className="border-b border-[#f0e4d8] text-xs uppercase tracking-wide text-[#7a6f68]">
                <th className="px-4 py-3">과제명</th>
                <th className="px-4 py-3">수업명</th>
                <th className="px-4 py-3">수강생</th>
                <th className="px-4 py-3">제출일</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">과제 보기</th>
                <th className="px-4 py-3">피드백</th>
                <th className="px-4 py-3">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-[#7a6f68]">
                    조건에 맞는 과제가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="border-b border-[#f7eee4] last:border-none">
                    <td className="px-4 py-3 font-semibold">{assignment.title}</td>
                    <td className="px-4 py-3">{assignment.course}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold">{assignment.student.name}</span>
                        <span className="text-xs text-[#7a6f68]">{assignment.student.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {assignment.submittedAt ? new Date(assignment.submittedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClassName[assignment.status]}`}>
                        {assignment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="rounded-xl bg-[#ffd331] px-3 py-2 text-xs font-semibold text-[#404040] shadow transition hover:bg-[#e6bd2c] disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => handlePreview(assignment)}
                        disabled={!assignment.fileUrl && !assignment.link}
                      >
                        미리보기
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center text-lg font-bold text-[#404040]">
                      {feedbackExists(assignment.id) ? 'O' : 'X'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-xl bg-[#404040] px-3 py-2 text-xs font-semibold text-white shadow transition hover:bg-[#2f2f2f]"
                          onClick={() => navigate(`/admin/feedback/new?assignmentId=${assignment.id}`)}
                        >
                          피드백 작성
                        </button>
                        <button
                          type="button"
                          className="rounded-xl bg-[#f5eee9] px-3 py-2 text-xs font-semibold text-[#c43c3c] shadow transition hover:bg-[#ffe3e3]"
                          onClick={() => handleDelete(assignment.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 md:hidden">
          {filteredAssignments.length === 0 ? (
            <div className="rounded-2xl bg-[#fdf8f2] p-4 text-sm text-[#7a6f68]">조건에 맞는 과제가 없습니다.</div>
          ) : (
            filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="rounded-2xl border border-[#f0e4d8] bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#404040]">{assignment.title}</h3>
                    <p className="text-xs text-[#7a6f68]">{assignment.course}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClassName[assignment.status]}`}>
                    {assignment.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-[#404040]">
                  <p>
                    <span className="font-semibold">수강생:</span> {assignment.student.name} · {assignment.student.email}
                  </p>
                  <p>
                    <span className="font-semibold">제출일:</span> {assignment.submittedAt ? new Date(assignment.submittedAt).toLocaleString() : '-'}
                  </p>
                  <p>
                    <span className="font-semibold">피드백:</span> {feedbackExists(assignment.id) ? 'O' : 'X'}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-xl bg-[#ffd331] px-3 py-2 text-xs font-semibold text-[#404040] shadow transition hover:bg-[#e6bd2c] disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handlePreview(assignment)}
                    disabled={!assignment.fileUrl && !assignment.link}
                  >
                    미리보기
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-xl bg-[#404040] px-3 py-2 text-xs font-semibold text-white shadow transition hover:bg-[#2f2f2f]"
                    onClick={() => navigate(`/admin/feedback/new?assignmentId=${assignment.id}`)}
                  >
                    피드백 작성
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-xl bg-[#ffe3e3] px-3 py-2 text-xs font-semibold text-[#c43c3c] shadow transition hover:bg-[#ffcccc]"
                    onClick={() => handleDelete(assignment.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <CourseResetModal
        isOpen={isResetModalOpen}
        courses={courses}
        selectedCourse={resetCourse}
        onSelectCourse={setResetCourse}
        onConfirm={handleResetConfirm}
        onClose={() => {
          setIsResetModalOpen(false);
          setResetCourse(null);
        }}
      />

      {selectedAssignment ? <AssignmentPreviewModal assignment={selectedAssignment} onClose={closePreview} /> : null}
      {toast ? <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} /> : null}
    </div>
  );
};

export default AdminAssignmentsManagement;
