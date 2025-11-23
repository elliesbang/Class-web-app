import { useMemo, useState } from 'react';

import type { AssignmentWithRelations } from '@/lib/api/assignments';

interface AssignmentListProps {
  assignments: AssignmentWithRelations[];
  onSubmitFeedback?: (assignmentId: number, content: string) => Promise<void>;
  submittingFeedbackId?: number | null;
}

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

const statusLabel = (status?: string | null) => {
  if (status === 'success') return '성공';
  return '미제출';
};

const submissionType = (row: AssignmentWithRelations) => {
  if (row.image_url) return '이미지 제출';
  if (row.link_url) return '링크 제출';
  return '미제출';
};

const AssignmentList = ({ assignments, onSubmitFeedback, submittingFeedbackId }: AssignmentListProps) => {
  const [feedback, setFeedback] = useState<Record<number, string>>({});

  const hasFeedbackFeature = useMemo(() => typeof onSubmitFeedback === 'function', [onSubmitFeedback]);

  const handleSubmitFeedback = async (assignmentId: number) => {
    if (!onSubmitFeedback) return;
    const content = feedback[assignmentId]?.trim();
    if (!content) {
      alert('피드백 내용을 입력해주세요.');
      return;
    }
    await onSubmitFeedback(assignmentId, content);
    setFeedback((prev) => ({ ...prev, [assignmentId]: '' }));
  };

  if (!assignments.length) {
    return <p className="text-sm text-ellieGray/70">제출된 과제가 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-ivory/70">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-ellieGray">학생 이름</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-ellieGray">회차</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-ellieGray">제출 형태</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-ellieGray">썸네일</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-ellieGray">제출일</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-ellieGray">상태</th>
            {hasFeedbackFeature ? (
              <th className="px-4 py-3 text-left text-xs font-semibold text-ellieGray">피드백</th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white/80">
          {assignments.map((row) => (
            <tr key={row.id} className="align-top">
              <td className="px-4 py-3 text-sm text-ellieGray/90">{row.profiles?.name || row.student_id}</td>
              <td className="px-4 py-3 text-sm text-ellieGray/90">{row.session_no}</td>
              <td className="px-4 py-3 text-sm text-ellieGray/90">{submissionType(row)}</td>
              <td className="px-4 py-3 text-sm text-ellieGray/90">
                {row.image_url ? (
                  <img
                    src={row.image_url}
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                ) : row.link_url ? (
                  <span className="text-[#d98200] font-semibold">링크 제출</span>
                ) : (
                  <span className="text-ellieGray/60">없음</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-ellieGray/90">{formatDateTime(row.created_at)}</td>
              <td className="px-4 py-3 text-sm text-ellieGray/90">{statusLabel(row.status)}</td>
              {hasFeedbackFeature ? (
                <td className="px-4 py-3 text-sm text-ellieGray/90">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      {(row.assignment_feedbacks ?? []).map((feedbackItem) => (
                        <div key={feedbackItem.id} className="rounded-xl bg-ivory/70 px-3 py-2 text-xs text-ellieGray/90">
                          <p className="font-semibold">{feedbackItem.content || '내용 없음'}</p>
                          <p className="text-[11px] text-ellieGray/60">{formatDateTime(feedbackItem.created_at)}</p>
                        </div>
                      ))}
                      {(row.assignment_feedbacks?.length ?? 0) === 0 ? (
                        <p className="text-xs text-ellieGray/60">등록된 피드백이 없습니다.</p>
                      ) : null}
                    </div>
                    <textarea
                      className="w-full rounded-xl border border-ivory px-3 py-2 text-xs"
                      placeholder="피드백을 입력하세요"
                      value={feedback[row.id] ?? ''}
                      onChange={(e) => setFeedback((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="rounded-xl bg-[#ffd331] px-3 py-2 text-xs font-semibold text-ellieGray shadow-soft disabled:opacity-50"
                      onClick={() => void handleSubmitFeedback(row.id)}
                      disabled={submittingFeedbackId === row.id}
                    >
                      {submittingFeedbackId === row.id ? '저장 중...' : '피드백 저장'}
                    </button>
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssignmentList;
