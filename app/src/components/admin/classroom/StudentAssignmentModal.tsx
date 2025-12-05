import { useEffect, useMemo, useState } from 'react';

import AdminModal from '@/components/admin/AdminModal';
import { createAssignmentFeedback } from '@/lib/api/assignmentFeedback';
import type { AssignmentWithRelations } from '@/lib/api/assignments';
import type { Student } from './StudentProgressTable';

type StudentAssignmentModalProps = {
  student: Student;
  submissions: AssignmentWithRelations[];
  onClose: () => void;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

const renderContent = (submission: AssignmentWithRelations) => {
  if (submission.image_url) {
    return (
      <img
        src={submission.image_url}
        alt={`세션 ${submission.session_no} 제출 이미지`}
        className="h-40 w-full rounded-xl object-cover"
      />
    );
  }

  if (submission.link_url) {
    return (
      <a
        href={submission.link_url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-[#d98200] underline"
      >
        링크 열기
      </a>
    );
  }

  if (submission.text_content) {
    return <p className="whitespace-pre-wrap text-sm text-[#404040]">{submission.text_content}</p>;
  }

  return <p className="text-sm text-ellieGray/70">제출된 콘텐츠가 없습니다.</p>;
};

const StudentAssignmentModal = ({ student, submissions, onClose }: StudentAssignmentModalProps) => {
  const [feedbackInputs, setFeedbackInputs] = useState<Record<number, string>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [entries, setEntries] = useState<AssignmentWithRelations[]>(submissions);

  useEffect(() => {
    setEntries(submissions);
  }, [submissions]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.session_no - b.session_no),
    [entries],
  );

  const handleSubmitFeedback = async (assignmentId: number) => {
    const content = feedbackInputs[assignmentId]?.trim();
    if (!content) {
      alert('피드백 내용을 입력해주세요.');
      return;
    }

    setSubmittingId(assignmentId);
    try {
      const feedback = await createAssignmentFeedback({ assignment_id: assignmentId, content });
      setEntries((prev) =>
        prev.map((item) =>
          item.id === assignmentId
            ? {
                ...item,
                assignment_feedbacks: [
                  ...(item.assignment_feedbacks ?? []),
                  feedback,
                ],
              }
            : item,
        ),
      );
      setFeedbackInputs((prev) => ({ ...prev, [assignmentId]: '' }));
    } catch (error) {
      console.error('[StudentAssignmentModal] failed to save feedback', error);
      alert('피드백 저장 중 오류가 발생했습니다.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <AdminModal
      title={`${student.name || '학생'} 제출 내역`}
      subtitle={`이메일: ${student.email}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        {sortedEntries.length === 0 ? (
          <p className="text-sm text-ellieGray/70">제출된 과제가 없습니다.</p>
        ) : (
          sortedEntries.map((submission) => (
            <div
              key={submission.id}
              className="rounded-2xl border border-[#f1e7dd] bg-[#fdf8f2] p-4 shadow-soft"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#7a6f68]">세션 {submission.session_no}</p>
                  <p className="text-sm text-[#404040]">제출일: {formatDateTime(submission.created_at) || '정보 없음'}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#404040]">
                  {submission.type ? submission.type.toUpperCase() : '제출'}
                </span>
              </div>

              <div className="mt-3 rounded-xl bg-white p-3">{renderContent(submission)}</div>

              <div className="mt-4 space-y-3 rounded-xl bg-white p-3">
                <p className="text-xs font-semibold text-[#7a6f68]">피드백</p>
                <div className="space-y-2">
                  {(submission.assignment_feedbacks ?? []).map((fb) => (
                    <div key={fb.id} className="rounded-xl bg-[#fdf8f2] px-3 py-2 text-xs text-[#404040]">
                      <p className="font-semibold">{fb.content || '내용 없음'}</p>
                      <p className="text-[11px] text-ellieGray/70">{formatDateTime(fb.created_at)}</p>
                    </div>
                  ))}
                  {(submission.assignment_feedbacks?.length ?? 0) === 0 ? (
                    <p className="text-xs text-ellieGray/70">등록된 피드백이 없습니다.</p>
                  ) : null}
                </div>

                <textarea
                  className="w-full rounded-xl border border-ivory px-3 py-2 text-sm"
                  placeholder="피드백을 입력하세요"
                  value={feedbackInputs[submission.id] ?? ''}
                  onChange={(e) =>
                    setFeedbackInputs((prev) => ({ ...prev, [submission.id]: e.target.value }))
                  }
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="rounded-xl bg-[#ffd331] px-4 py-2 text-sm font-semibold text-[#404040] shadow-soft disabled:opacity-50"
                    onClick={() => void handleSubmitFeedback(submission.id)}
                    disabled={submittingId === submission.id}
                  >
                    {submittingId === submission.id ? '저장 중...' : '피드백 저장'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminModal>
  );
};

export default StudentAssignmentModal;
