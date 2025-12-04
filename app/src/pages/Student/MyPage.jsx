import React, { useEffect, useMemo, useState } from 'react';
import { logout } from '@/lib/auth';
import { useAuthUser } from '@/context/AuthContext';

function fetchJSON(url) {
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(url + ' 요청 실패');
    return res.json();
  });
}

export default function StudentMyPage() {
  const { user: authUser } = useAuthUser();

  // 로그인 ID (profiles.id)
  const studentId = useMemo(() => {
    if (!authUser || authUser.role !== 'student') return null;
    return authUser.id;
  }, [authUser]);

  const [classrooms, setClassrooms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ------------------------------
  // 📌 Cloudflare Functions API 주소
  // ------------------------------
  const API_CLASSROOM = `/api/student-classrooms?student=${studentId}`;
  const API_ASSIGNMENT = `/api/student-assignments?student=${studentId}`;
  const API_FEEDBACK = `/api/student-feedback?student=${studentId}`;
  const API_COURSE = `/api/student-courses`;

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    let cancel = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchJSON(API_CLASSROOM),
      fetchJSON(API_ASSIGNMENT),
      fetchJSON(API_FEEDBACK),
      fetchJSON(API_COURSE),
    ])
      .then(([classroomRes, assignmentRes, feedbackRes, courseRes]) => {
        if (cancel) return;

        setClassrooms(classroomRes?.items ?? []);
        setAssignments(assignmentRes?.items ?? []);
        setFeedbacks(feedbackRes?.items ?? []);
        setCourses(courseRes?.items ?? []);
      })
      .catch((err) => {
        if (cancel) return;
        console.error('MyPage Load Failed:', err);
        setError(err);
      })
      .finally(() => {
        if (cancel) return;
        setLoading(false);
      });

    return () => (cancel = true);
  }, [studentId]);

  // ------------------------------
  // 📌 가까운 주차(week) 정렬
  // ------------------------------
  const upcomingLessons = useMemo(() => {
    if (courses.length === 0) return [];
    const sorted = [...courses].sort((a, b) => a.week - b.week);
    return sorted.slice(0, 3);
  }, [courses]);

  // ------------------------------
  // 📌 feedback : assignment.id → feedback 연결
  // ------------------------------
  const feedbackMap = useMemo(() => {
    const map = new Map();
    feedbacks.forEach((fb) => {
      if (fb.assignment_id) {
        map.set(fb.assignment_id, fb);
      }
    });
    return map;
  }, [feedbacks]);

  const handleUpload = () => {
    window.location.href = '/classroom/assignments/upload';
  };

  // ------------------------------
  // 🔥 UI 렌더링 시작
  // ------------------------------
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={logout}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ellieGray shadow-sm transition-colors hover:bg-[#fef568]/40"
        >
          로그아웃
        </button>
      </div>

      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">수강생 마이페이지</h1>
        <p className="mt-2 text-sm text-ellieGray/70">
          내 수업과 과제, 피드백 현황을 한 번에 확인하세요.
        </p>
      </header>

      {error && (
        <div className="rounded-3xl bg-red-50 p-5 text-sm text-red-600 shadow-soft">
          데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
        </div>
      )}

      {/* ---------------- 등록 수업 ---------------- */}
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ellieGray">등록된 수업</h2>
          <p className="text-xs text-ellieGray/60">내가 등록한 클래스 목록</p>

          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-ellieGray/60">불러오는 중...</p>
            ) : classrooms.length === 0 ? (
              <p className="text-sm text-ellieGray/60">등록된 수업이 없습니다.</p>
            ) : (
              classrooms.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-200 p-4">
                  <p className="font-semibold">{item.classes?.name}</p>
                </div>
              ))
            )}
          </div>
        </article>

        {/* ---------------- 이번 주 수업 ---------------- */}
        <article className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ellieGray">이번 주 수업</h2>
          <p className="text-xs text-ellieGray/60">다가오는 주차 기준</p>

          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-ellieGray/60">불러오는 중...</p>
            ) : upcomingLessons.length === 0 ? (
              <p className="text-sm text-ellieGray/60">예정 수업이 없습니다.</p>
            ) : (
              upcomingLessons.map((lesson) => (
                <div key={lesson.id} className="rounded-xl border border-gray-200 p-4">
                  <p className="font-semibold">{lesson.title}</p>
                  <p className="text-xs text-ellieGray/60">주차: {lesson.week}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      {/* ---------------- 과제 제출 현황 ---------------- */}
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl bg-white p-6 shadow-soft">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">나의 과제 제출 현황</h2>
              <p className="text-xs text-ellieGray/60">최근 제출 순</p>
            </div>

            <button
              type="button"
              onClick={handleUpload}
              className="rounded-full bg-ellieOrange px-4 py-2 text-xs font-semibold text-white shadow-soft"
            >
              과제 업로드
            </button>
          </header>

          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-ellieGray/60">불러오는 중...</p>
            ) : assignments.length === 0 ? (
              <p className="text-sm text-ellieGray/60">제출한 과제가 없습니다.</p>
            ) : (
              assignments.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-200 p-4">
                  <p className="font-semibold">{item.session_no}회차</p>

                  {item.link_url && (
                    <p className="text-xs text-ellieGray/70">
                      링크: <a href={item.link_url} className="underline text-ellieOrange" target="_blank">바로가기</a>
                    </p>
                  )}

                  {item.image_url && (
                    <img
                      src={item.image_url}
                      className="mt-2 max-h-48 rounded-xl border object-contain"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </article>

        {/* ---------------- 피드백 ---------------- */}
        <article className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-ellieGray">내 피드백 현황</h2>
          <p className="text-xs text-ellieGray/60">과제별 강사 피드백</p>

          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-ellieGray/60">불러오는 중...</p>
            ) : assignments.length === 0 ? (
              <p className="text-sm text-ellieGray/60">피드백을 확인할 과제가 없습니다.</p>
            ) : (
              assignments.map((item) => {
                const fb = feedbackMap.get(item.id);
                return (
                  <div key={item.id} className="rounded-xl border border-gray-200 p-4">
                    <p className="font-semibold">{item.session_no}회차</p>
                    <p className="text-xs text-ellieGray/70">
                      담당자: {fb?.admin_name ?? '미배정'}
                    </p>
                    <p className="text-xs text-ellieGray/70">
                      피드백: {fb?.feedback ?? '대기 중'}
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
