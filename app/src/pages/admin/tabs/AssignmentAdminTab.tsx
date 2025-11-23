import { useCallback, useEffect, useMemo, useState } from 'react';

import AssignmentList from '@/components/admin/AssignmentList';
import { fetchAssignments } from '@/lib/api/assignments';
import { createAssignmentFeedback } from '@/lib/api/assignmentFeedback';
import { supabase } from '@/lib/supabaseClient';
import type { AssignmentWithRelations } from '@/lib/api/assignments';

interface ClassOption {
  id: number;
  name?: string | null;
}

const AssignmentAdminTab = () => {
  const [classroomId, setClassroomId] = useState<string>('');
  const [sessionNo, setSessionNo] = useState<string>('');
  const [assignments, setAssignments] = useState<AssignmentWithRelations[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [feedbackTargetId, setFeedbackTargetId] = useState<number | null>(null);

  useEffect(() => {
    const loadClasses = async () => {
      const { data } = await supabase.from('classes').select('id, name').order('id', { ascending: true });
      setClasses(data ?? []);
    };
    void loadClasses();
  }, []);

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAssignments({
        classroom_id: classroomId || undefined,
        session_no: sessionNo || undefined,
      });
      setAssignments(data ?? []);
    } catch (err) {
      setError('과제 목록을 불러오지 못했습니다.');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [classroomId, sessionNo]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const handleSubmitFeedback = useCallback(
    async (assignmentId: number, content: string) => {
      setFeedbackTargetId(assignmentId);
      try {
        await createAssignmentFeedback({ assignment_id: assignmentId, content });
        await loadAssignments();
      } catch (err) {
        alert('피드백 저장 중 오류가 발생했습니다.');
      } finally {
        setFeedbackTargetId(null);
      }
    },
    [loadAssignments],
  );

  const classOptions = useMemo(() => [{ id: 0, name: '전체' }, ...classes], [classes]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/80 p-4 shadow-soft">
        <h2 className="text-lg font-semibold text-ellieGray">과제 관리</h2>
        <p className="text-sm text-ellieGray/70">classroom / 회차별로 제출 현황을 확인합니다.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="text-sm text-ellieGray/80">
            강의실
            <select
              className="mt-2 w-full rounded-xl border border-ivory px-3 py-2"
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
            >
              {classOptions.map((item) => (
                <option key={item.id} value={item.id === 0 ? '' : item.id}>
                  {item.name ? `${item.name} (${item.id})` : item.id === 0 ? '전체' : item.id}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-ellieGray/80">
            회차 (숫자)
            <input
              className="mt-2 w-full rounded-xl border border-ivory px-3 py-2"
              type="number"
              min="1"
              value={sessionNo}
              onChange={(e) => setSessionNo(e.target.value)}
              placeholder="전체"
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="button"
              className="w-full rounded-xl bg-[#ffd331] px-3 py-2 font-semibold text-ellieGray shadow-soft"
              onClick={() => void loadAssignments()}
            >
              필터 적용
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {loading ? (
        <p className="text-sm text-ellieGray/70">불러오는 중...</p>
      ) : (
        <AssignmentList
          assignments={assignments}
          onSubmitFeedback={handleSubmitFeedback}
          submittingFeedbackId={feedbackTargetId}
        />
      )}
    </div>
  );
};

export default AssignmentAdminTab;
