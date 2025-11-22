import { useEffect, useState } from 'react';

import { getAssignments } from '../../api/assignments';
import { createFeedback } from '../../api/feedback';
import Table from '../../components/Table';

interface AssignmentRow {
  id: number;
  class_id?: number;
  user_id?: string;
  submission_url?: string;
  submission_image?: string;
  created_at?: string;
  assignments_feedback?: { id: number; content?: string; created_at?: string }[];
}

const AssignmentFeedbackPage = () => {
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [feedbackText, setFeedbackText] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data, error: fetchError } = await getAssignments();
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setAssignments(data ?? []);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveFeedback = async (assignmentId: number) => {
    const content = feedbackText[assignmentId];
    if (!content) {
      alert('피드백 내용을 입력해주세요.');
      return;
    }

    const { error: submitError } = await createFeedback({ assignment_id: assignmentId, content });
    if (submitError) {
      alert(submitError.message);
      return;
    }

    setFeedbackText((prev) => ({ ...prev, [assignmentId]: '' }));
    await fetchData();
    alert('피드백이 저장되었습니다.');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-6 shadow-xl shadow-black/5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#c18f1f]">Assignments</p>
        <h2 className="text-xl font-black text-[#3f3a37]">과제·피드백 관리</h2>
        <p className="text-sm text-[#6a5c50]">제출물을 확인하고 피드백을 남길 수 있습니다.</p>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 shadow-inner">{error}</div>
      ) : null}

      <Table
        title="과제 제출물"
        description={loading ? '불러오는 중입니다...' : `총 ${assignments.length}건`}
        headers={['ID', '클래스', '학생', '제출물', '제출일', '피드백']}
      >
        {loading ? (
          <tr>
            <td colSpan={6} className="px-4 py-6 text-center text-sm text-[#6a5c50]">
              데이터를 불러오는 중입니다.
            </td>
          </tr>
        ) : assignments.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-4 py-6 text-center text-sm text-[#6a5c50]">
              제출물이 없습니다.
            </td>
          </tr>
        ) : (
          assignments.map((assignment) => (
            <tr key={assignment.id} className="align-top hover:bg-[#fffaf0]">
              <td className="px-4 py-3 text-sm font-semibold">{assignment.id}</td>
              <td className="px-4 py-3 text-sm text-[#5c5246]">{assignment.class_id ?? '-'}</td>
              <td className="px-4 py-3 text-sm text-[#5c5246]">{assignment.user_id ?? '-'}</td>
              <td className="px-4 py-3 text-sm text-[#5c5246]">
                {assignment.submission_url ? (
                  <a
                    href={assignment.submission_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#c18f1f] underline"
                  >
                    제출 링크 열기
                  </a>
                ) : null}
                {assignment.submission_image ? (
                  <img src={assignment.submission_image} alt="제출물" className="mt-2 w-32 rounded-xl border border-[#f1e4c2]" />
                ) : null}
                {!assignment.submission_url && !assignment.submission_image ? '제출물 없음' : null}
              </td>
              <td className="px-4 py-3 text-sm text-[#5c5246]">{assignment.created_at?.slice(0, 10)}</td>
              <td className="px-4 py-3 text-sm text-[#5c5246]">
                <div className="space-y-2">
                  <textarea
                    value={feedbackText[assignment.id] ?? ''}
                    onChange={(e) => setFeedbackText((prev) => ({ ...prev, [assignment.id]: e.target.value }))}
                    className="w-full rounded-xl border border-[#f1e4c2] bg-white px-3 py-2 text-sm shadow-inner"
                    placeholder="관리자 피드백을 입력하세요."
                    rows={3}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveFeedback(assignment.id)}
                      className="rounded-full bg-[#ffd331] px-4 py-2 text-xs font-semibold text-[#3f3a37] shadow-md transition hover:bg-[#f3c623]"
                    >
                      피드백 저장
                    </button>
                    {assignment.assignments_feedback?.length ? (
                      <span className="rounded-full bg-[#fff7d6] px-3 py-1 text-xs font-semibold text-[#3f3a37] shadow-inner">
                        기존 피드백 {assignment.assignments_feedback.length}개
                      </span>
                    ) : null}
                  </div>

                  {assignment.assignments_feedback?.length ? (
                    <div className="space-y-2 rounded-2xl bg-[#fffaf0] p-3 text-xs text-[#5c5246] shadow-inner">
                      {assignment.assignments_feedback.map((feedback) => (
                        <div key={feedback.id} className="rounded-xl bg-white px-3 py-2 shadow-sm">
                          <p className="font-semibold text-[#3f3a37]">{feedback.content || '내용 없음'}</p>
                          <p className="text-[11px] text-[#6a5c50]">{feedback.created_at?.slice(0, 10)}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </td>
            </tr>
          ))
        )}
      </Table>
    </div>
  );
};

export default AssignmentFeedbackPage;
