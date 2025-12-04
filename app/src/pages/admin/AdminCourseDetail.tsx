import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

type CourseStatus = '진행 중' | '준비 중' | '종료';

type StudentPreview = {
  name: string;
  email: string;
  registeredAt: string;
};

type ContentPreview = {
  title: string;
  type: '영상' | '자료' | '공지';
  createdAt: string;
};

type AssignmentPreview = {
  id: number;
  studentName: string;
  submittedAt: string;
  thumbnailLabel: string;
};

type FeedbackPreview = {
  id: number;
  studentName: string;
  summary: string;
};

type CourseDetailData = {
  id: number;
  title: string;
  type: string;
  manager: string;
  status: CourseStatus;
  startDate: string;
  endDate: string;
  uploadPeriod: string;
  description?: string;
  students: {
    total: number;
    lastUpdated: string;
    preview: StudentPreview[];
  };
  contents: {
    videos: number;
    files: number;
    notices: number;
    recent: ContentPreview[];
  };
  assignments: {
    submitted: number;
    total: number;
    recent: AssignmentPreview[];
  };
  feedback: {
    completed: number;
    total: number;
    recent: FeedbackPreview[];
  };
};

const statusColors: Record<CourseStatus, string> = {
  '진행 중': 'bg-green-100 text-green-700 border border-green-300',
  '준비 중': 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  종료: 'bg-gray-100 text-gray-600 border border-gray-300',
};

const statusOrder: CourseStatus[] = ['준비 중', '진행 중', '종료'];

const courseDetails: Record<number, CourseDetailData> = {
  1: {
    id: 1,
    title: '미치나 8기',
    type: '챌린지',
    manager: '관리자',
    status: '진행 중',
    startDate: '2025-11-01',
    endDate: '2025-11-21',
    uploadPeriod: '00:00~23:59',
    description: '3주간 미리캔버스 요소 업로드 챌린지 과정입니다.',
    students: {
      total: 25,
      lastUpdated: '2025-10-19',
      preview: [
        { name: '홍길동', email: 'hong@example.com', registeredAt: '2025-10-12' },
        { name: '이영희', email: 'lee@example.com', registeredAt: '2025-10-12' },
        { name: '정민수', email: 'minsoo@example.com', registeredAt: '2025-10-13' },
      ],
    },
    contents: {
      videos: 3,
      files: 2,
      notices: 1,
      recent: [
        { title: '미치나 8기 1회차', type: '영상', createdAt: '2025-10-20' },
        { title: '워크북 템플릿 공유', type: '자료', createdAt: '2025-10-18' },
        { title: '오리엔테이션 공지', type: '공지', createdAt: '2025-10-16' },
      ],
    },
    assignments: {
      submitted: 18,
      total: 25,
      recent: [
        { id: 101, studentName: '이영희', submittedAt: '2025-10-20 21:30', thumbnailLabel: 'LEE' },
        { id: 102, studentName: '박민준', submittedAt: '2025-10-20 20:55', thumbnailLabel: 'PM' },
        { id: 103, studentName: '김서연', submittedAt: '2025-10-20 20:42', thumbnailLabel: 'SY' },
      ],
    },
    feedback: {
      completed: 14,
      total: 18,
      recent: [
        { id: 201, studentName: '이영희', summary: '색감 조합이 좋아요! 다음 과제에서도 유지해봐요.' },
        { id: 202, studentName: '박민준', summary: '타이포 정렬을 조금 더 정교하게 조정하면 좋겠습니다.' },
        { id: 203, studentName: '김서연', summary: '참신한 아이디어였습니다. 추가 리소스를 참고해보세요.' },
      ],
    },
  },
  2: {
    id: 2,
    title: '캔디마 2기',
    type: '강의',
    manager: '김민지',
    status: '준비 중',
    startDate: '2025-12-02',
    endDate: '2025-12-31',
    uploadPeriod: '06:00~23:59',
    description: '디자인 마케팅 실전 강의 프로그램으로 곧 모집 예정입니다.',
    students: {
      total: 18,
      lastUpdated: '2025-10-17',
      preview: [
        { name: '이준호', email: 'leejun@example.com', registeredAt: '2025-10-10' },
        { name: '정소영', email: 'soyoung@example.com', registeredAt: '2025-10-12' },
        { name: '황지민', email: 'jm.hwang@example.com', registeredAt: '2025-10-15' },
      ],
    },
    contents: {
      videos: 0,
      files: 2,
      notices: 1,
      recent: [
        { title: '커리큘럼 안내', type: '자료', createdAt: '2025-10-19' },
        { title: '오리엔테이션 일정 안내', type: '공지', createdAt: '2025-10-18' },
      ],
    },
    assignments: {
      submitted: 0,
      total: 18,
      recent: [],
    },
    feedback: {
      completed: 0,
      total: 0,
      recent: [],
    },
  },
  3: {
    id: 3,
    title: '나캔디 1기 원데이 워크샵',
    type: '원데이',
    manager: '관리자',
    status: '종료',
    startDate: '2025-11-05',
    endDate: '2025-11-05',
    uploadPeriod: '09:00~18:00',
    description: '하루 동안 진행된 집중 실습 워크샵입니다.',
    students: {
      total: 32,
      lastUpdated: '2025-11-04',
      preview: [
        { name: '박서연', email: 'seo@example.com', registeredAt: '2025-10-25' },
        { name: '최가영', email: 'gayeong@example.com', registeredAt: '2025-10-26' },
        { name: '문지후', email: 'jihoo@example.com', registeredAt: '2025-10-28' },
      ],
    },
    contents: {
      videos: 4,
      files: 6,
      notices: 2,
      recent: [
        { title: '워크샵 다시보기', type: '영상', createdAt: '2025-11-06' },
        { title: '실습 자료 패키지', type: '자료', createdAt: '2025-11-05' },
        { title: '설문 안내', type: '공지', createdAt: '2025-11-05' },
      ],
    },
    assignments: {
      submitted: 29,
      total: 32,
      recent: [
        { id: 301, studentName: '박서연', submittedAt: '2025-11-05 19:10', thumbnailLabel: 'SY' },
        { id: 302, studentName: '최가영', submittedAt: '2025-11-05 18:55', thumbnailLabel: 'GY' },
        { id: 303, studentName: '문지후', submittedAt: '2025-11-05 18:50', thumbnailLabel: 'JH' },
      ],
    },
    feedback: {
      completed: 27,
      total: 29,
      recent: [
        { id: 401, studentName: '박서연', summary: '과제 완성도가 높습니다. 다음 단계도 기대됩니다.' },
        { id: 402, studentName: '최가영', summary: '디테일이 아주 섬세합니다. 훌륭해요.' },
        { id: 403, studentName: '문지후', summary: '시간 내 업로드 감사합니다. 전반적으로 안정적입니다.' },
      ],
    },
  },
};

const AdminCourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = Number(id);

  const course = courseDetails[numericId];

  const [currentStatus, setCurrentStatus] = useState<CourseStatus>(course?.status ?? '준비 중');
  const [showStudentPreview, setShowStudentPreview] = useState(false);

  const assignmentRate = useMemo(() => {
    if (!course || course.assignments.total === 0) return 0;
    return Math.round((course.assignments.submitted / course.assignments.total) * 100);
  }, [course]);

  const feedbackRate = useMemo(() => {
    if (!course || course.feedback.total === 0) return 0;
    return Math.round((course.feedback.completed / course.feedback.total) * 100);
  }, [course]);

  const contentTotal = useMemo(() => {
    if (!course) return 0;
    return course.contents.videos + course.contents.files + course.contents.notices;
  }, [course]);

  const contentProgress = useMemo(() => {
    if (contentTotal === 0) return 0;
    return Math.min(Math.round((contentTotal / 10) * 100), 100);
  }, [contentTotal]);

  const handleStatusToggle = () => {
    setCurrentStatus((prev) => {
      const currentIndex = statusOrder.indexOf(prev);
      const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
      return nextStatus;
    });
  };

  useEffect(() => {
    if (course) {
      setCurrentStatus(course.status);
      setShowStudentPreview(false);
    }
  }, [course]);

  if (!course) {
    return (
      <div className="space-y-6 text-[#404040]">
        <div className="rounded-2xl bg-white p-6 text-center shadow-md">
          <h1 className="text-2xl font-bold">수업을 찾을 수 없습니다.</h1>
          <p className="mt-2 text-sm text-[#5c5c5c]">
            요청하신 수업이 삭제되었거나 존재하지 않습니다. 목록으로 돌아가 다시 시도해주세요.
          </p>
          <button
            type="button"
            className="mt-4 rounded-full bg-[#ffd331] px-6 py-2 text-sm font-semibold text-[#404040] shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#e6bd2c]"
            onClick={() => navigate('/admin/class')}
          >
            수업 목록으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#404040]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-full border border-[#e9dccf] bg-white px-4 py-2 text-sm font-semibold text-[#5c5c5c] transition-all hover:-translate-y-0.5 hover:border-[#ffd331]"
            onClick={() => navigate(-1)}
          >
            ← 뒤로가기
          </button>
          <h1 className="text-2xl font-bold">수업 상세 보기</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-[#ffd331] px-4 py-2 text-sm font-semibold text-[#404040] shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#e6bd2c]"
            onClick={() => navigate(`/admin/classrooms/${id}/videos`)}
          >
            콘텐츠 관리로 이동
          </button>
          <button
            type="button"
            className="rounded-full border border-[#e9dccf] bg-white px-4 py-2 text-sm font-semibold text-[#404040] transition-all hover:-translate-y-0.5 hover:border-[#ffd331]"
            onClick={() => navigate(`/admin/assignments?category=${encodeURIComponent(course.title)}`)}
          >
            과제 관리로 이동
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="shadow-md rounded-xl bg-white p-6">
          <p className="text-sm text-[#5c5c5c]">📈 과제 제출률</p>
          <p className="mt-2 text-2xl font-bold text-[#404040]">{assignmentRate}%</p>
          <div className="mt-3 h-2 rounded-full bg-[#f0e3d8]">
            <div className="h-full rounded-full bg-[#ffd331]" style={{ width: `${assignmentRate}%` }} />
          </div>
        </div>
        <div className="shadow-md rounded-xl bg-white p-6">
          <p className="text-sm text-[#5c5c5c]">💬 피드백 완료율</p>
          <p className="mt-2 text-2xl font-bold text-[#404040]">{feedbackRate}%</p>
          <div className="mt-3 h-2 rounded-full bg-[#f0e3d8]">
            <div className="h-full rounded-full bg-[#ffd331]" style={{ width: `${feedbackRate}%` }} />
          </div>
        </div>
        <div className="shadow-md rounded-xl bg-white p-6">
          <p className="text-sm text-[#5c5c5c]">📁 콘텐츠 등록 수</p>
          <p className="mt-2 text-2xl font-bold text-[#404040]">{contentTotal}개</p>
          <div className="mt-3 h-2 rounded-full bg-[#f0e3d8]">
            <div className="h-full rounded-full bg-[#ffd331]" style={{ width: `${contentProgress}%` }} />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="shadow-md rounded-2xl bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold">{course.title}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[currentStatus]}`}>
                  {currentStatus}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#5c5c5c]">{course.description ?? '등록된 설명이 없습니다.'}</p>
            </div>
            <button
              type="button"
              className="rounded-full bg-[#f5eee9] px-4 py-2 text-sm font-semibold text-[#5c5c5c] transition-all hover:-translate-y-0.5 hover:bg-[#ffd331]/70"
              onClick={handleStatusToggle}
            >
              상태 변경
            </button>
          </div>
          <dl className="mt-4 grid gap-4 text-sm text-[#5c5c5c] md:grid-cols-2">
            <div>
              <dt className="font-semibold text-[#404040]">수업 유형</dt>
              <dd className="mt-1">{course.type}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#404040]">담당 관리자</dt>
              <dd className="mt-1">{course.manager}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#404040]">수업 기간</dt>
              <dd className="mt-1">
                {course.startDate} ~ {course.endDate}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[#404040]">업로드 가능 시간</dt>
              <dd className="mt-1">{course.uploadPeriod}</dd>
            </div>
          </dl>
        </div>

        <div className="shadow-md rounded-2xl bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
            <h2 className="text-lg font-bold">수강생 요약</h2>
            <button
              type="button"
              className="rounded-full border border-[#e9dccf] bg-white px-4 py-2 text-sm font-semibold text-[#404040] transition-all hover:-translate-y-0.5 hover:border-[#ffd331]"
              onClick={() => setShowStudentPreview((prev) => !prev)}
            >
              {showStudentPreview ? '명단 닫기' : '명단 보기'}
            </button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-[#fdf7f0] p-4">
              <p className="text-sm text-[#5c5c5c]">등록된 수강생</p>
              <p className="mt-1 text-3xl font-bold text-[#404040]">총 {course.students.total}명</p>
            </div>
            <div className="rounded-xl bg-[#fdf7f0] p-4">
              <p className="text-sm text-[#5c5c5c]">최근 명단 업데이트</p>
              <p className="mt-1 text-lg font-semibold text-[#404040]">{course.students.lastUpdated}</p>
            </div>
          </div>
          {showStudentPreview && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#f0e3d8]">
              <table className="min-w-full divide-y divide-[#f0e3d8]">
                <thead className="bg-[#fdf7f0]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">이름</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">이메일</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5c5c5c]">등록일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0e3d8] bg-white">
                  {course.students.preview.map((student) => (
                    <tr key={student.email}>
                      <td className="px-4 py-3 text-sm text-[#404040]">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-[#5c5c5c]">{student.email}</td>
                      <td className="px-4 py-3 text-sm text-[#5c5c5c]">{student.registeredAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="shadow-md rounded-2xl bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
              <h2 className="text-lg font-bold">콘텐츠 현황</h2>
              <button
                type="button"
                className="rounded-full border border-[#e9dccf] bg-white px-4 py-2 text-sm font-semibold text-[#404040] transition-all hover:-translate-y-0.5 hover:border-[#ffd331]"
                onClick={() => navigate(`/admin/classrooms/${id}/videos`)}
              >
                콘텐츠 관리로 이동
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-[#fdf7f0] p-4 text-center">
                <p className="text-sm text-[#5c5c5c]">영상</p>
                <p className="mt-1 text-2xl font-bold text-[#404040]">{course.contents.videos}개</p>
              </div>
              <div className="rounded-xl bg-[#fdf7f0] p-4 text-center">
                <p className="text-sm text-[#5c5c5c]">자료</p>
                <p className="mt-1 text-2xl font-bold text-[#404040]">{course.contents.files}개</p>
              </div>
              <div className="rounded-xl bg-[#fdf7f0] p-4 text-center">
                <p className="text-sm text-[#5c5c5c]">공지</p>
                <p className="mt-1 text-2xl font-bold text-[#404040]">{course.contents.notices}개</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {course.contents.recent.map((content) => (
                <div key={`${content.title}-${content.createdAt}`} className="flex items-center justify-between rounded-xl border border-[#f0e3d8] bg-white px-4 py-3 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-[#404040]">
                      [{content.type}] {content.title}
                    </p>
                    <p className="text-xs text-[#5c5c5c]">{content.createdAt}</p>
                  </div>
                </div>
              ))}
              {course.contents.recent.length === 0 && (
                <p className="rounded-xl border border-dashed border-[#f0e3d8] bg-[#fdf7f0] px-4 py-6 text-center text-sm text-[#a18f80]">
                  등록된 콘텐츠가 없습니다.
                </p>
              )}
            </div>
          </div>

          <div className="shadow-md rounded-2xl bg-white p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
              <h2 className="text-lg font-bold">과제 제출 현황</h2>
              <button
                type="button"
                className="rounded-full border border-[#e9dccf] bg-white px-4 py-2 text-sm font-semibold text-[#404040] transition-all hover:-translate-y-0.5 hover:border-[#ffd331]"
                onClick={() => navigate(`/admin/assignments?category=${encodeURIComponent(course.title)}`)}
              >
                과제 관리로 이동
              </button>
            </div>
            <div className="rounded-xl bg-[#fdf7f0] p-4">
              <p className="text-sm text-[#5c5c5c]">
                제출된 과제 <span className="font-semibold text-[#404040]">{course.assignments.submitted}</span> / 전체{' '}
                <span className="font-semibold text-[#404040]">{course.assignments.total}</span>
              </p>
              <div className="mt-3 h-2 rounded-full bg-[#f0e3d8]">
                <div
                  className="h-full rounded-full bg-[#ffd331]"
                  style={{ width: `${assignmentRate}%` }}
                />
              </div>
              <p className="mt-2 text-sm font-semibold text-[#404040]">제출률 {assignmentRate}%</p>
            </div>
            <div className="space-y-3">
              {course.assignments.recent.length > 0 ? (
                course.assignments.recent.map((submission) => (
                  <div key={submission.id} className="flex items-center gap-4 rounded-xl border border-[#f0e3d8] bg-white px-4 py-3 shadow-sm">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#f5eee9] text-lg font-bold text-[#404040]">
                      {submission.thumbnailLabel}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#404040]">{submission.studentName}</p>
                      <p className="text-xs text-[#5c5c5c]">업로드 {submission.submittedAt}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-[#f0e3d8] bg-[#fdf7f0] px-4 py-6 text-center text-sm text-[#a18f80]">
                  아직 제출된 과제가 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="shadow-md rounded-2xl bg-white p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
            <h2 className="text-lg font-bold">피드백 현황</h2>
            <button
              type="button"
              className="rounded-full border border-[#e9dccf] bg-white px-4 py-2 text-sm font-semibold text-[#404040] transition-all hover:-translate-y-0.5 hover:border-[#ffd331]"
              onClick={() => navigate(`/admin/feedback?category=${encodeURIComponent(course.title)}`)}
            >
              피드백 관리로 이동
            </button>
          </div>
          <div className="rounded-xl bg-[#fdf7f0] p-4">
            <p className="text-sm text-[#5c5c5c]">
              피드백 완료 <span className="font-semibold text-[#404040]">{course.feedback.completed}</span> / 제출{' '}
              <span className="font-semibold text-[#404040]">{course.feedback.total}</span>
            </p>
            <div className="mt-3 h-2 rounded-full bg-[#f0e3d8]">
              <div className="h-full rounded-full bg-[#ffd331]" style={{ width: `${feedbackRate}%` }} />
            </div>
            <p className="mt-2 text-sm font-semibold text-[#404040]">피드백 완료율 {feedbackRate}%</p>
          </div>
          <div className="space-y-3">
            {course.feedback.recent.length > 0 ? (
              course.feedback.recent.map((item) => (
                <div key={item.id} className="rounded-xl border border-[#f0e3d8] bg-white px-4 py-3 shadow-sm">
                  <p className="text-sm font-semibold text-[#404040]">{item.studentName}</p>
                  <p className="mt-1 text-sm text-[#5c5c5c]">{item.summary}</p>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-[#f0e3d8] bg-[#fdf7f0] px-4 py-6 text-center text-sm text-[#a18f80]">
                아직 등록된 피드백이 없습니다.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminCourseDetail;
