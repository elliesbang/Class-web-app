import { useCallback, useEffect, useMemo, useState } from 'react';

import Toast, { ToastVariant } from '../../components/admin/Toast';

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
  const [toast, setToast] = useState<{ message: string; variant?: ToastVariant } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(false);
      setStats([]);
      setSections([]);
      setToast(null);

      // const fetchDashboardResource = async <T extends { id: number }>(
      //   input: string,
      //   key: 'videos' | 'materials' | 'notices',
      // ): Promise<{ items: T[]; hasFatalError: boolean }> => {
      //   try {
      //     const response = await fetch(input);
      //     ...
      //   } catch (networkError) {
      //     console.warn(`[AdminDashboardHome] Failed to request ${input}`, networkError);
      //     return { items: [], hasFatalError: true };
      //   }
      // };

      // try {
      //   const classList = DEFAULT_CLASS_LIST;
      //   const [videoResult, materialResult, noticeResult] = await Promise.all([
      //     fetchDashboardResource<VideoPayload>('/api/videos', 'videos'),
      //     fetchDashboardResource<MaterialPayload>('/api/materials', 'materials'),
      //     fetchDashboardResource<NoticePayload>('/api/notices', 'notices'),
      //   ]);
      //   ...
      // } catch (error) {
      //   console.warn('[AdminDashboardHome] Failed to load admin dashboard data', error);
      // }
    };

    void loadDashboardData();
  }, [formatSectionDate]);

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#404040]">엘리의방 관리자 대시보드</h2>
            <p className="text-sm font-semibold text-[#7a6f68]">{formattedDate}</p>
          </div>
        </div>
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
