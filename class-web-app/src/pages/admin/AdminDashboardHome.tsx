import { useState } from 'react';

import AdminModal from '../../components/admin/AdminModal';
import Toast from '../../components/admin/Toast';

const stats = [
  { title: '전체 수업 수', value: '24' },
  { title: '전체 수강생 수', value: '128' },
  { title: '오늘 업로드된 과제 수', value: '5' },
  { title: '오늘 작성된 피드백 수', value: '12' },
];

const contentSections = [
  {
    title: '영상 게시판',
    items: [
      { title: '6월 집중 코칭 - Day 1', date: '2024-06-12', author: '엘리' },
      { title: '라이브 녹화본 업로드 안내', date: '2024-06-11', author: '운영팀' },
      { title: '신규 커리큘럼 소개 영상', date: '2024-06-10', author: '엘리' },
    ],
  },
  {
    title: '공지 게시판',
    items: [
      { title: '7월 개강 일정 안내', date: '2024-06-12', author: '운영팀' },
      { title: '엘리 선생님 휴무 공지', date: '2024-06-11', author: '엘리' },
      { title: '플랫폼 업데이트 예정 안내', date: '2024-06-09', author: '개발팀' },
    ],
  },
  {
    title: '피드백',
    items: [
      { title: '김나래 수강생 주간 피드백', date: '2024-06-12', author: '엘리' },
      { title: '박서윤 수강생 주간 피드백', date: '2024-06-11', author: '엘리' },
      { title: '이현우 수강생 첨삭 완료', date: '2024-06-11', author: '멘토진' },
    ],
  },
];

const AdminDashboardHome = () => {
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'long',
  }).format(today);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeletingDummyData, setIsDeletingDummyData] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRequestDeleteDummyData = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmDeleteDummyData = async () => {
    setIsDeletingDummyData(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setToastMessage('모든 더미 데이터가 삭제되었습니다.');
    } finally {
      setIsDeletingDummyData(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#404040]">엘리의방 관리자 대시보드</h2>
            <p className="text-sm font-semibold text-[#7a6f68]">{formattedDate}</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl bg-[#ff6b6b] px-6 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#e75a5a] disabled:cursor-not-allowed disabled:bg-[#f3b1b1]"
            onClick={handleRequestDeleteDummyData}
            disabled={isDeletingDummyData}
          >
            {isDeletingDummyData ? '삭제 처리 중...' : '전체 더미 삭제'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl bg-white/80 p-4 shadow-md transition-transform hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm font-semibold text-[#7a6f68]">{stat.title}</p>
            <p className="mt-3 text-3xl font-bold text-[#404040]">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-[#404040]">최근 등록된 콘텐츠</h3>
        <div className="grid gap-4 lg:grid-cols-3">
          {contentSections.map((section) => (
            <div key={section.title} className="rounded-2xl bg-white/80 p-5 shadow-md">
              <h4 className="mb-3 text-base font-bold text-[#404040]">{section.title}</h4>
              <ul className="space-y-3 text-sm">
                {section.items.map((item) => (
                  <li
                    key={`${section.title}-${item.title}`}
                    className="rounded-xl bg-[#f8f1ea] p-4 shadow-sm"
                  >
                    <p className="font-semibold text-[#404040]">{item.title}</p>
                    <p className="mt-1 text-xs text-[#7a6f68]">{item.date} · {item.author}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="rounded-2xl bg-white/80 p-6 text-center shadow-md">
          <h3 className="text-lg font-bold text-[#404040]">시스템 로그 / 알림</h3>
          <p className="mt-2 text-sm text-[#7a6f68]">시스템 로그가 여기에 표시될 예정입니다. (준비 중입니다.)</p>
        </div>
      </section>

      {isConfirmOpen ? (
        <AdminModal
          title="전체 더미 데이터 삭제"
          subtitle="정말 삭제하시겠습니까?"
          onClose={() => {
            if (!isDeletingDummyData) {
              setIsConfirmOpen(false);
            }
          }}
          footer={
            <>
              <button
                type="button"
                className="rounded-2xl bg-[#f5eee9] px-5 py-2 text-sm font-semibold text-[#404040] transition-colors hover:bg-[#ffd331]/80 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isDeletingDummyData}
              >
                취소
              </button>
              <button
                type="button"
                className="rounded-2xl bg-[#ff6b6b] px-5 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#e75a5a] disabled:cursor-not-allowed disabled:bg-[#f3b1b1]"
                onClick={handleConfirmDeleteDummyData}
                disabled={isDeletingDummyData}
              >
                {isDeletingDummyData ? '삭제 중...' : '삭제'}
              </button>
            </>
          }
        >
          <div className="space-y-3 text-sm leading-relaxed text-[#404040]">
            <p>
              시스템 전역의 영상, 자료, 공지, 챌린지, 클래스, 사용자, 피드백 등에서
              <span className="font-semibold text-[#d64545]"> dummy, test, demo, 더미, 임시 </span>
              등의 키워드를 포함한 모든 레코드를 삭제합니다.
            </p>
            <p className="text-xs text-[#7a6f68]">실제 업로드된 영상이나 파일은 삭제하지 않고 데이터베이스 항목만 제거합니다.</p>
          </div>
        </AdminModal>
      ) : null}

      {toastMessage ? (
        <Toast message={toastMessage} variant="success" onClose={() => setToastMessage(null)} />
      ) : null}
    </div>
  );
};

export default AdminDashboardHome;
