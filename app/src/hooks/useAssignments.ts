import { useEffect, useState } from 'react';

export type AssignmentRecord = Record<string, any>;

type UseAssignmentsResult = {
  assignments: AssignmentRecord[];
  isLoading: boolean;
  error: string | null;
};

const useAssignments = (classId: string): UseAssignmentsResult => {
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAssignments = async () => {
      if (!classId) {
        setAssignments([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/assignments-list?class_id=${classId}`);
        if (!response.ok) {
          throw new Error('과제 목록을 불러올 수 없습니다.');
        }
        const data = await response.json();
        if (!isMounted) return;
        const payload = Array.isArray((data as Record<string, any>)?.assignments)
          ? (data as Record<string, any>).assignments
          : Array.isArray(data)
            ? data
            : [];
        setAssignments(payload);
      } catch (caught) {
        if (!isMounted) return;
        console.error('[classroom-content] assignments load failed', caught);
        setAssignments([]);
        setError('과제 목록을 불러오지 못했습니다.');
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    void fetchAssignments();

    return () => {
      isMounted = false;
    };
  }, [classId]);

  return { assignments, isLoading, error };
};

export default useAssignments;
