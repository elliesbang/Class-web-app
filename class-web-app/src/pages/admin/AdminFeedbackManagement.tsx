import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CourseResetModal from '../../components/admin/CourseResetModal';
import AdminModal from '../../components/admin/AdminModal';
import Toast, { type ToastVariant } from '../../components/admin/Toast';
import { useAdminData, type Assignment, type Feedback } from './data/AdminDataContext';
import type { ClassInfo } from '../../lib/api';
import { createFeedback, getClasses } from '../../lib/api';

type ToastState = {
  message: string;
  variant?: ToastVariant;
};

type FeedbackFormState = {
  mode: 'create' | 'edit';
  assignment: Assignment | null;
  targetFeedback: Feedback | null;
};

const dateFilterOptions = [
  { label: '전체', value: 'all' },
  { label: '최근 7일', value: '7' },
  { label: '최근 30일', value: '30' },
];

const truncateText = (content: string, limit = 50) => {
  if (content.length <= limit) {
    return content;
  }
  return `${content.slice(0, limit)}…`;
};

const FeedbackViewModal = ({
  feedback,
  assignment,
  onClose,
}: {
  feedback: Feedback;
  assignment: Assignment | null;
  onClose: () => void;
}) => (
  <AdminModal title="피드백 상세" subtitle={`${feedback.student.name} · ${feedback.course}`} onClose={onClose}>
    <div className="space-y-4 text-sm text-[#404040]">
      <div className="rounded-2xl bg-[#fdf8f2] p-4">
        <p className="font-semibold">과제명</p>
        <p className="mt-1 text-[#7a6f68]">{assignment ? assignment.title : `과제 #${feedback.assignmentId}`}</p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-inner">
        <p className="whitespace-pre-wrap leading-relaxed">{feedback.content}</p>
        {feedback.attachmentUrl ? (
          <a
            href={feedback.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#ffd331] px-3 py-2 text-xs font-semibold text-[#404040] shadow hover:bg-[#e6bd2c]"
          >
            첨부 파일 열기
          </a>
        ) : null}
      </div>
      <div className="grid gap-2 text-xs text-[#7a6f68]">
        <span>작성자: {feedback.author}</span>
        <span>작성일: {new Date(feedback.createdAt).toLocaleString()}</span>
      </div>
    </div>
  </AdminModal>
);

const FeedbackFormModal = ({
  state,
  onClose,
  onSubmit,
  classId,
  onClassChange,
  classes,
  isLoading,
}: {
  state: FeedbackFormState;
  onClose: () => void;
  onSubmit: (payload: { content: string; author: string; attachmentUrl?: string; classId: number | null }) => Promise<void> | void;
  classId: number | null;
  onClassChange: (value: number) => void;
  classes: ClassInfo[];
  isLoading: boolean;
}) => {
  const isEdit = state.mode === 'edit';
  const [content, setContent] = useState(state.targetFeedback?.content ?? '');
  const [author, setAuthor] = useState(state.targetFeedback?.author ?? '관리자');
  const [attachmentUrl, setAttachmentUrl] = useState(state.targetFeedback?.attachmentUrl ?? '');

  useEffect(() => {
    setContent(state.targetFeedback?.content ?? '');
    setAuthor(state.targetFeedback?.author ?? '관리자');
    setAttachmentUrl(state.targetFeedback?.attachmentUrl ?? '');
  }, [state]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      content: content.trim(),
      author: author.trim(),
      attachmentUrl: attachmentUrl.trim() || undefined,
      classId,
    });
  };

  return (
    <AdminModal
      title={isEdit ? '피드백 수정' : '피드백 작성'}
      subtitle={state.assignment ? `${state.assignment.title} · ${state.assignment.student.name}` : '연결할 과제를 선택하세요.'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-sm text-[#404040]">
        <div className="grid gap-2 rounded-2xl bg-[#fdf8f2] p-4">
          <div className="flex flex-wrap justify-between gap-3">
            <span className="font-semibold">과제명</span>
            <span>{state.assignment ? state.assignment.title : '-'}</span>
          </div>
          <div className="flex flex-wrap justify-between gap-3">
            <span className="font-semibold">수강생</span>
            <span>
              {state.assignment ? `${state.assignment.student.name} · ${state.assignment.student.email}` : '-'}
            </span>
          </div>
          <div className="flex flex-wrap justify-between gap-3">
            <span className="font-semibold">수업명</span>
            <span>{state.assignment ? state.assignment.course : '-'}</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold">작성자</label>
          <input
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            className="w-full rounded-xl border border-[#e9dccf] bg-white px-3 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold">수업 카테고리</label>
          <select
            value={classId ?? ''}
            onChange={(event) => onClassChange(Number(event.target.value))}
            className="w-full rounded-xl border border-[#e9dccf] bg-white px-3 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
            disabled={isLoading || classes.length === 0}
            required
          >
            <option value="" disabled>
              수업을 선택하세요
            </option>
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold">피드백 내용</label>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="h-40 w-full rounded-xl border border-[#e9dccf] bg-white px-3 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
            placeholder="수강생에게 전달할 피드백을 작성해주세요."
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold">첨부 파일 링크 (선택)</label>
          <input
            value={attachmentUrl}
            onChange={(event) => setAttachmentUrl(event.target.value)}
            type="url"
            className="w-full rounded-xl border border-[#e9dccf] bg-white px-3 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
            placeholder="https://example.com/file.pdf"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="rounded-xl bg-[#f5eee9] px-4 py-2 text-sm font-semibold text-[#404040] hover:bg-[#e9dccf]"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="submit"
            className="rounded-xl bg-[#404040] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#2f2f2f]"
          >
            {isEdit ? '수정 완료' : '등록'}
          </button>
        </div>
      </form>
    </AdminModal>
  );
};

const AdminFeedbackManagement = () => {
  const { assignments, feedbacks, addFeedback, updateFeedback, deleteFeedback, batchResetCourse } = useAdminData();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('전체');
  const [authorFilter, setAuthorFilter] = useState<string>('전체');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetCourse, setResetCourse] = useState<string | null>(null);
  const [viewTarget, setViewTarget] = useState<Feedback | null>(null);
  const [formState, setFormState] = useState<FeedbackFormState | null>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [formClassId, setFormClassId] = useState<number | null>(null);

  const viewAssignment = useMemo(() => {
    if (!viewTarget) {
      return null;
    }
    return assignments.find((item) => item.id === viewTarget.assignmentId) ?? null;
  }, [assignments, viewTarget]);

  const courses = useMemo(() => {
    const courseSet = new Set<string>();
    assignments.forEach((assignment) => courseSet.add(assignment.course));
    feedbacks.forEach((feedback) => courseSet.add(feedback.course));
    return Array.from(courseSet);
  }, [assignments, feedbacks]);
  const authors = useMemo(() => Array.from(new Set(feedbacks.map((feedback) => feedback.author))), [feedbacks]);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const fetched = await getClasses();
        setClasses(fetched);
      } catch (error) {
        console.error('Failed to load class list', error);
        setToast({ message: '수업 목록을 불러오지 못했습니다.', variant: 'error' });
      } finally {
        setIsLoadingClasses(false);
      }
    };

    void loadClasses();
  }, []);

  const filteredFeedbacks = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const now = new Date();

    return feedbacks.filter((feedback) => {
      const matchesKeyword =
        keyword.length === 0 ||
        [feedback.content, feedback.course, feedback.student.name, feedback.student.email].some((value) =>
          value.toLowerCase().includes(keyword),
        );

      const matchesCourse = courseFilter === '전체' || feedback.course === courseFilter;
      const matchesAuthor = authorFilter === '전체' || feedback.author === authorFilter;

      const matchesDate = (() => {
        if (dateFilter === 'all') {
          return true;
        }
        const diff = (now.getTime() - new Date(feedback.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (dateFilter === '7') {
          return diff <= 7;
        }
        if (dateFilter === '30') {
          return diff <= 30;
        }
        return true;
      })();

      return matchesKeyword && matchesCourse && matchesAuthor && matchesDate;
    });
  }, [authorFilter, courseFilter, dateFilter, feedbacks, searchTerm]);

  useEffect(() => {
    if (location.pathname.endsWith('/new')) {
      const assignmentIdFromQuery = searchParams.get('assignmentId');
      const assignment = assignmentIdFromQuery
        ? assignments.find((item) => item.id === Number(assignmentIdFromQuery))
        : undefined;
      setFormState({ mode: 'create', assignment: assignment ?? null, targetFeedback: null });
    } else if (location.pathname.includes('/edit') && params.id) {
      const targetFeedback = feedbacks.find((feedback) => feedback.id === Number(params.id));
      if (targetFeedback) {
        const assignment = assignments.find((item) => item.id === targetFeedback.assignmentId) ?? null;
        setFormState({ mode: 'edit', assignment, targetFeedback });
      } else {
        setToast({ message: '해당 피드백을 찾을 수 없습니다.', variant: 'error' });
        navigate('/admin/feedback', { replace: true });
      }
    } else {
      setFormState(null);
    }
  }, [assignments, feedbacks, location.pathname, navigate, params.id, searchParams]);

  useEffect(() => {
    if (!formState) {
      setFormClassId(null);
      return;
    }

    if (formState.mode === 'edit') {
      setFormClassId(formState.targetFeedback?.classId ?? classes[0]?.id ?? null);
    } else {
      setFormClassId(classes[0]?.id ?? null);
    }
  }, [classes, formState]);

  const closeFormModal = () => {
    setFormState(null);
    if (location.pathname !== '/admin/feedback') {
      navigate('/admin/feedback', { replace: true });
    }
  };

  const handleCreateFeedback = async (payload: { content: string; author: string; attachmentUrl?: string; classId: number | null }) => {
    if (!formState?.assignment) {
      setToast({ message: '연결된 과제 정보가 필요합니다.', variant: 'error' });
      return;
    }

    if (!payload.content) {
      setToast({ message: '피드백 내용을 입력해주세요.', variant: 'error' });
      return;
    }

    if (payload.classId === null) {
      setToast({ message: '수업 카테고리를 선택해주세요.', variant: 'error' });
      return;
    }

    try {
      const className = classes.find((classItem) => classItem.id === payload.classId)?.name ?? '선택한 클래스';
      await createFeedback({
        userName: payload.author || '관리자',
        comment: payload.content,
        classId: payload.classId,
      });

      addFeedback({
        assignmentId: formState.assignment.id,
        content: payload.content,
        author: payload.author || '관리자',
        attachmentUrl: payload.attachmentUrl,
        classId: payload.classId,
      });
      setToast({ message: `선택한 클래스(${className})에 업로드되었습니다.`, variant: 'success' });
      closeFormModal();
    } catch (error) {
      console.error('Failed to create feedback', error);
      setToast({
        message: error instanceof Error ? error.message : '피드백 등록 중 오류가 발생했습니다.',
        variant: 'error',
      });
    }
  };

  const handleUpdateFeedback = async (payload: { content: string; author: string; attachmentUrl?: string; classId?: number | null }) => {
    if (!formState?.targetFeedback) {
      return;
    }

    updateFeedback(formState.targetFeedback.id, {
      content: payload.content,
      author: payload.author,
      attachmentUrl: payload.attachmentUrl,
      ...(payload.classId !== undefined ? { classId: payload.classId } : {}),
    });
    setToast({ message: '피드백이 수정되었습니다.', variant: 'success' });
    closeFormModal();
  };

  const handleDeleteFeedback = (feedbackId: number) => {
    if (window.confirm('피드백을 삭제하시겠습니까?')) {
      deleteFeedback(feedbackId);
      setToast({ message: '피드백이 삭제되었습니다.', variant: 'success' });
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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#404040]">피드백 관리</h2>
          <p className="text-sm text-[#7a6f68]">작성된 피드백을 모아 관리하고 과제와 연동하세요.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="과제명, 수강생 또는 수업명을 검색하세요"
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
            value={authorFilter}
            onChange={(event) => setAuthorFilter(event.target.value)}
            className="rounded-2xl border border-[#e9dccf] bg-white px-3 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none"
          >
            <option value="전체">전체 작성자</option>
            {authors.map((author) => (
              <option key={author} value={author}>
                {author}
              </option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="rounded-2xl border border-[#e9dccf] bg-white px-3 py-2 text-sm text-[#404040] focus:border-[#ffd331] focus:outline-none"
          >
            {dateFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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

      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm text-[#404040]">
            <thead>
              <tr className="border-b border-[#f0e4d8] text-xs uppercase tracking-wide text-[#7a6f68]">
                <th className="px-4 py-3">피드백 내용</th>
                <th className="px-4 py-3">과제명</th>
                <th className="px-4 py-3">수업명</th>
                <th className="px-4 py-3">수강생</th>
                <th className="px-4 py-3">작성자</th>
                <th className="px-4 py-3">작성일</th>
                <th className="px-4 py-3">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedbacks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-[#7a6f68]">
                    조건에 맞는 피드백이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredFeedbacks.map((feedback) => {
                  const assignment = assignments.find((item) => item.id === feedback.assignmentId) ?? null;
                  return (
                    <tr key={feedback.id} className="border-b border-[#f7eee4] last:border-none">
                      <td className="px-4 py-3">{truncateText(feedback.content)}</td>
                      <td className="px-4 py-3">{assignment ? assignment.title : '-'}</td>
                      <td className="px-4 py-3">{feedback.course}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold">{feedback.student.name}</span>
                          <span className="text-xs text-[#7a6f68]">{feedback.student.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{feedback.author}</td>
                      <td className="px-4 py-3 text-sm">{new Date(feedback.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-xl bg-[#ffd331] px-3 py-2 text-xs font-semibold text-[#404040] shadow hover:bg-[#e6bd2c]"
                            onClick={() => setViewTarget(feedback)}
                          >
                            보기
                          </button>
                          <button
                            type="button"
                            className="rounded-xl bg-[#404040] px-3 py-2 text-xs font-semibold text-white shadow hover:bg-[#2f2f2f]"
                            onClick={() => navigate(`/admin/feedback/edit/${feedback.id}`)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-xl bg-[#f5eee9] p-2 text-[#c43c3c] shadow hover:bg-[#ffe3e3]"
                            onClick={() => handleDeleteFeedback(feedback.id)}
                            aria-label="피드백 삭제"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="rounded-xl bg-[#e8f8f0] px-3 py-2 text-xs font-semibold text-[#17853a] shadow hover:bg-[#c5efd9]"
                            onClick={() => navigate(`/admin/assignments/${feedback.assignmentId}`)}
                          >
                            관련 과제 보기
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 md:hidden">
          {filteredFeedbacks.length === 0 ? (
            <div className="rounded-2xl bg-[#fdf8f2] p-4 text-sm text-[#7a6f68]">조건에 맞는 피드백이 없습니다.</div>
          ) : (
            filteredFeedbacks.map((feedback) => {
              const assignment = assignments.find((item) => item.id === feedback.assignmentId) ?? null;
              return (
                <div key={feedback.id} className="rounded-2xl border border-[#f0e4d8] bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#404040]">{assignment ? assignment.title : '-'}</h3>
                      <p className="mt-1 text-xs text-[#7a6f68]">{feedback.course}</p>
                    </div>
                    <span className="text-xs text-[#7a6f68]">{new Date(feedback.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-3 text-sm text-[#404040]">{truncateText(feedback.content, 80)}</p>
                  <div className="mt-3 text-xs text-[#7a6f68]">
                    <p>
                      <span className="font-semibold">수강생:</span> {feedback.student.name} · {feedback.student.email}
                    </p>
                    <p>
                      <span className="font-semibold">작성자:</span> {feedback.author}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="flex-1 rounded-xl bg-[#ffd331] px-3 py-2 text-xs font-semibold text-[#404040] shadow hover:bg-[#e6bd2c]"
                      onClick={() => setViewTarget(feedback)}
                    >
                      보기
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-xl bg-[#404040] px-3 py-2 text-xs font-semibold text-white shadow hover:bg-[#2f2f2f]"
                      onClick={() => navigate(`/admin/feedback/edit/${feedback.id}`)}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-xl bg-[#ffe3e3] px-3 py-2 text-xs font-semibold text-[#c43c3c] shadow hover:bg-[#ffcccc]"
                      onClick={() => handleDeleteFeedback(feedback.id)}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span>삭제</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-xl bg-[#e8f8f0] px-3 py-2 text-xs font-semibold text-[#17853a] shadow hover:bg-[#c5efd9]"
                      onClick={() => navigate(`/admin/assignments/${feedback.assignmentId}`)}
                    >
                      관련 과제
                    </button>
                  </div>
                </div>
              );
            })
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

      {viewTarget ? (
        <FeedbackViewModal feedback={viewTarget} assignment={viewAssignment} onClose={() => setViewTarget(null)} />
      ) : null}

      {formState ? (
        <FeedbackFormModal
          state={formState}
          onClose={closeFormModal}
          onSubmit={formState.mode === 'edit' ? handleUpdateFeedback : handleCreateFeedback}
          classId={formClassId}
          onClassChange={(value) => setFormClassId(value)}
          classes={classes}
          isLoading={isLoadingClasses}
        />
      ) : null}

      {toast ? <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} /> : null}
    </div>
  );
};

export default AdminFeedbackManagement;
