import React, { useEffect, useMemo, useState } from 'react';
import { useAuthUser } from '../../hooks/useAuthUser';

function fetchJSON(url) {
  return fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`요청에 실패했습니다: ${url}`);
    }
    return response.json();
  });
}

export default function StudentMyPage() {
  const authUser = useAuthUser();
  const [classrooms, setClassrooms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const studentIdentifier = useMemo(() => {
    if (!authUser || authUser.role !== 'student') {
      return null;
    }
    return authUser.user_id || authUser.email || null;
  }, [authUser]);

  useEffect(() => {
    if (!studentIdentifier) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const classroomUrl = `/api/classroom?student=${encodeURIComponent(studentIdentifier)}`;
    const assignmentUrl = `/api/assignment-submit?student=${encodeURIComponent(studentIdentifier)}`;
    const feedbackUrl = `/api/feedback?student=${encodeURIComponent(studentIdentifier)}`;

    Promise.all([
      fetchJSON(classroomUrl),
      fetchJSON(assignmentUrl),
      fetchJSON(feedbackUrl),
      fetchJSON('/api/course'),
    ])
      .then(([classroomData, assignmentData, feedbackData, courseData]) => {
        if (!isMounted) return;
        setClassrooms(classroomData?.items ?? []);
        setAssignments(assignmentData?.items ?? []);
        setFeedbacks(feedbackData?.items ?? []);
        setCourses(courseData?.items ?? []);
      })
      .catch((caught) => {
        if (!isMounted) return;
        console.error('[StudentMyPage] failed to load data', caught);
        setError(caught);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [studentIdentifier]);

  const upcomingLessons = useMemo(() => {
    if (courses.length === 0) return [];

    const sorted = [...courses].sort((a, b) => {
      const aWeek = Number.parseInt(a.week, 10);
      const bWeek = Number.parseInt(b.week, 10);
      if (Number.isNaN(aWeek) || Number.isNaN(bWeek)) {
        return (a.createdTime || '').localeCompare(b.createdTime || '');
      }
      return aWeek - bWeek;
    });

    return sorted.slice(0, 3);
  }, [courses]);

  const feedbackMap = useMemo(() => {
    const map = new Map();
    feedbacks.forEach((feedback) => {
      const assignmentIds = Array.isArray(feedback.assignment)
        ? feedback.assignment
        : feedback.properties?.Assignment;
      if (Array.isArray(assignmentIds)) {
        assignmentIds.forEach((id) => {
          map.set(typeof id === 'string' ? id : id?.id, feedback);
        });
      }
    });
    return map;
  }, [feedbacks]);

  const handleUpload = () => {
    if (typeof window === 'undefined') return;
    window.location.href = '/classroom/assignments/upload';
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">수강생 마이페이지</h1>
        <p className="mt-2 text-sm text-ellieGray/70">
          내 수업과 과제, 피드백 현황을 한 번에 확인하세요.
        </p>
      </header>

      {error ? (
        <div className="rounded-3xl bg-red-50 p-5 text-sm text-red-600 shadow-soft">
          데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl bg-white p-6 shadow-soft">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ellieGray">등록된 수업</h2>
              <p className="text-xs text-ellieGray/60">실시간 노션 데이터 기반</p>
            </div>
          </header>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-ellieGray/60">데이터를 불러오는 중입니다...</p>
            ) : classrooms.length === 0 ? (
              <p className="text-sm text-ellieGray/60">등록된 수업이 없습니다.</p>
            ) : (
              classrooms.map((item) => (
                <div key={item.id} className="rounded-2xl border border-ellieGray/10 p-4">
                  <p className="text-sm font-semibold text-ellieGray">{item.name || '수업'}</p>
                  <p className="mt-1 text-xs text-ellieGray/60">상태: {item.status || '확인 필요'}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-soft">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ellieGray">이번 주 수업</h2>
              <p className="text-xs text-ellieGray/60">다가오는 주차 수업을 확인하세요.</p>
            </div>
          </header>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-ellieGray/60">데이터를 불러오는 중입니다...</p>
            ) : upcomingLessons.length === 0 ? (
              <p className="text-sm text-ellieGray/60">예정된 수업 정보가 없습니다.</p>
            ) : (
              upcomingLessons.map((lesson) => (
                <div key={lesson.id} className="rounded-2xl border border-ellieGray/10 p-4">
                  <p className="text-sm font-semibold text-ellieGray">{lesson.title || '수업'}</p>
                  <p className="mt-1 text-xs text-ellieGray/60">주차: {lesson.week || '-'}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl bg-white p-6 shadow-soft">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ellieGray">나의 과제 제출 현황</h2>
              <p className="text-xs text-ellieGray/60">최근 제출 순서로 정렬됩니다.</p>
            </div>
            <button
              type="button"
              onClick={handleUpload}
              className="rounded-full bg-ellieOrange px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-ellieOrange/90"
            >
              과제 업로드
            </button>
          </header>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-ellieGray/60">데이터를 불러오는 중입니다...</p>
            ) : assignments.length === 0 ? (
              <p className="text-sm text-ellieGray/60">제출한 과제가 없습니다.</p>
            ) : (
              assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-2xl border border-ellieGray/10 p-4">
                  <p className="text-sm font-semibold text-ellieGray">{assignment.week || '과제'}</p>
                  <p className="mt-1 text-xs text-ellieGray/60">링크: {assignment.link || '제출 링크 없음'}</p>
                  <p className="mt-1 text-xs text-ellieGray/60">상태: {assignment.status || '확인 중'}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-soft">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ellieGray">내 피드백 현황</h2>
              <p className="text-xs text-ellieGray/60">과제별 담당자 피드백을 확인하세요.</p>
            </div>
          </header>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-ellieGray/60">데이터를 불러오는 중입니다...</p>
            ) : assignments.length === 0 ? (
              <p className="text-sm text-ellieGray/60">피드백을 확인할 과제가 없습니다.</p>
            ) : (
              assignments.map((assignment) => {
                const feedback = feedbackMap.get(assignment.id);
                return (
                  <div key={assignment.id} className="rounded-2xl border border-ellieGray/10 p-4">
                    <p className="text-sm font-semibold text-ellieGray">{assignment.week || '과제'}</p>
                    <p className="mt-1 text-xs text-ellieGray/60">
                      담당자: {feedback?.admin || feedback?.properties?.Admin || '미배정'}
                    </p>
                    <p className="mt-1 text-xs text-ellieGray/60">
                      피드백: {feedback?.feedback || feedback?.properties?.Feedback || '대기 중'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
