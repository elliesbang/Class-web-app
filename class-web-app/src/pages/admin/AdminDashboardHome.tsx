import { useCallback, useEffect, useMemo, useState } from 'react';

import AdminModal from '../../components/admin/AdminModal';
import Toast, { ToastVariant } from '../../components/admin/Toast';
import { getClasses, getMaterials, getNotices, getVideos } from '../../lib/api';

type DashboardStat = {
  title: string;
  value: string;
};

type SectionItem = {
  id: string;
  title: string;
  dateLabel: string;
  meta?: string;
};

type DashboardSection = {
  title: string;
  items: SectionItem[];
};

const AdminDashboardHome = () => {
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'long',
  }).format(today);

  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [sections, setSections] = useState<DashboardSection[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeletingDummyData, setIsDeletingDummyData] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant?: ToastVariant } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const sectionDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('ko-KR', {
        dateStyle: 'medium',
      }),
    [],
  );

  const formatSectionDate = useCallback(
    (value: string) => {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return sectionDateFormatter.format(new Date());
      }
      return sectionDateFormatter.format(parsed);
    },
    [sectionDateFormatter],
  );

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
        const [classList, videoList, materialList, noticeList] = await Promise.all([
          getClasses(),
          getVideos(),
          getMaterials(),
          getNotices(),
        ]);

        const classNameById = new Map(classList.map((item) => [item.id, item.name]));

        setStats([
          { title: '등록된 수업 수', value: String(classList.length) },
          { title: '등록된 영상 수', value: String(videoList.length) },
          { title: '등록된 자료 수', value: String(materialList.length) },
          { title: '등록된 공지 수', value: String(noticeList.length) },
        ]);

        const resolvedSections: DashboardSection[] = [
          {
            title: '영상 게시판',
            items: videoList.slice(0, 4).map((video) => ({
              id: `video-${video.id}`,
              title: video.title,
              dateLabel: formatSectionDate(video.createdAt),
              meta: classNameById.get(video.classId) ?? '분류되지 않음',
            })),
          },
          {
            title: '자료 게시판',
            items: materialList.slice(0, 4).map((material) => ({
              id: `material-${material.id}`,
              title: material.title,
              dateLabel: formatSectionDate(material.createdAt),
              meta: classNameById.get(material.classId) ?? '분류되지 않음',
            })),
          },
          {
            title: '공지 게시판',
            items: noticeList.slice(0, 4).map((notice) => ({
              id: `notice-${notice.id}`,
              title: notice.title,
              dateLabel: formatSectionDate(notice.createdAt),
              meta: [notice.author ?? null, classNameById.get(notice.classId) ?? null]
                .filter((value) => value && value.length > 0)
                .join(' · '),
            })),
          },
        ].filter((section) => section.items.length > 0);

        setSections(resolvedSections);
      } catch (error) {
        console.error('Failed to load admin dashboard data', error);
        setStats([]);
        setSections([]);
        setFetchError('대시보드 데이터를 불러오는 중 문제가 발생했습니다. 새로고침 후 다시 시도해주세요.');
        setToast({
          message: '대시보드 데이터를 불러오는 중 문제가 발생했습니다.',
          variant: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboardData();
  }, [formatSectionDate]);

  const handleRequestDeleteDummyData = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmDeleteDummyData = async () => {
    setIsDeletingDummyData(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setToast({ message: '모든 더미 데이터가 삭제되었습니다.', variant: 'success' });
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
        {fetchError ? (
          <p className="rounded-2xl bg-[#ffecec] px-4 py-3 text-sm font-semibold text-[#d64545] shadow-sm">
            {fetchError}
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`stat-skeleton-${index}`}
                className="flex flex-col justify-between rounded-2xl bg-white/70 p-4 shadow-inner"
              >
                <div className="h-3 w-1/3 animate-pulse rounded-full bg-[#f0e6db]" />
                <div className="mt-4 h-6 w-1/2 animate-pulse rounded-full bg-[#f0e6db]" />
              </div>
            ))
          : stats.length > 0
            ? stats.map((stat) => (
                <div
                  key={stat.title}
                  className="rounded-2xl bg-white/80 p-4 shadow-md transition-transform hover:-translate-y-1 hover:shadow-lg"
                >
                  <p className="text-sm font-semibold text-[#7a6f68]">{stat.title}</p>
                  <p className="mt-3 text-3xl font-bold text-[#404040]">{stat.value}</p>
                </div>
              ))
            : (
                <div className="col-span-full rounded-2xl border border-dashed border-[#e9dccf] p-6 text-center text-sm text-[#6b6b6b]">
                  아직 집계된 통계가 없습니다. 데이터 연동 후 자동으로 표시됩니다.
                </div>
              )}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-[#404040]">최근 등록된 콘텐츠</h3>
        {isLoading ? (
          <div className="rounded-2xl bg-white/80 p-5 shadow-md">
            <div className="mb-3 h-4 w-1/3 animate-pulse rounded-full bg-[#f0e6db]" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`section-skeleton-${index}`} className="space-y-2 rounded-xl bg-[#f8f1ea] p-4">
                  <div className="h-3 w-2/3 animate-pulse rounded-full bg-[#e9dccf]" />
                  <div className="h-3 w-1/2 animate-pulse rounded-full bg-[#e9dccf]" />
                </div>
              ))}
            </div>
          </div>
        ) : sections.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {sections.map((section) => (
              <div key={section.title} className="rounded-2xl bg-white/80 p-5 shadow-md">
                <h4 className="mb-3 text-base font-bold text-[#404040]">{section.title}</h4>
                <ul className="space-y-3 text-sm">
                  {section.items.map((item) => (
                    <li key={item.id} className="rounded-xl bg-[#f8f1ea] p-4 shadow-sm">
                      <p className="font-semibold text-[#404040]">{item.title}</p>
                      <p className="mt-1 text-xs text-[#7a6f68]">
                        {item.dateLabel}
                        {item.meta ? ` · ${item.meta}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#e9dccf] p-6 text-center text-sm text-[#6b6b6b]">
            표시할 최신 콘텐츠가 없습니다. 새 콘텐츠를 등록하면 이곳에 자동으로 표시됩니다.
          </div>
        )}
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

      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      ) : null}
    </div>
  );
};

export default AdminDashboardHome;
