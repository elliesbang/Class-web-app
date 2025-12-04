import React, { useEffect, useMemo, useState } from 'react';

const QUICK_ACTIONS = [
  { id: 'classrooms', label: '강의실 관리', href: '/admin/classrooms' },
  { id: 'class', label: '수업 추가', href: '/admin/classroom/new' },
  { id: 'progress', label: '학습 현황', href: '/admin/analytics' },
];

export default function AdminMyPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch('/.netlify/functions/admin')
      .then((response) => {
        if (!response.ok) {
          throw new Error('대시보드 데이터를 불러오지 못했습니다.');
        }
        return response.json();
      })
      .then((json) => {
        if (!isMounted) return;
        setData(json);
      })
      .catch((caught) => {
        if (!isMounted) return;
        console.error('[AdminMyPage] failed to load dashboard', caught);
        setError(caught);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = data?.metrics ?? {};
  const ongoingClasses = useMemo(() => data?.ongoingClasses ?? [], [data]);
  const recentActivities = useMemo(() => data?.recentActivities ?? [], [data]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-ellieGray">관리자 마이페이지</h1>
            <p className="mt-1 text-sm text-ellieGray/70">
              실시간 피드백 현황과 수업 진행 상황을 확인하세요.
            </p>
          </div>
          <div className="flex gap-2">
            {QUICK_ACTIONS.map((action) => (
              <a
                key={action.id}
                className="rounded-full bg-ellieOrange px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-ellieOrange/90"
                href={action.href}
              >
                {action.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardMetric
          title="전체 피드백"
          value={metrics.totalFeedback ?? '-'}
          subtitle="누적 피드백 수"
        />
        <DashboardMetric
          title="대기 피드백"
          value={metrics.pendingFeedback ?? '-'}
          subtitle="담당자 확인 필요"
          tone="warning"
        />
        <DashboardMetric
          title="이번 주 피드백"
          value={metrics.weeklyFeedback ?? '-'}
          subtitle="금주 작성 피드백"
        />
        <DashboardMetric
          title="진행 중 수업"
          value={metrics.ongoingClassCount ?? '-'}
          subtitle="운영 중인 클래스"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl bg-white p-6 shadow-soft">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ellieGray">진행 중 수업 목록</h2>
              <p className="text-xs text-ellieGray/60">노션에서 실시간으로 불러온 데이터입니다.</p>
            </div>
          </header>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-ellieGray/60">데이터를 불러오는 중입니다...</p>
            ) : error ? (
              <p className="text-sm text-red-500">대시보드 데이터를 확인할 수 없습니다.</p>
            ) : ongoingClasses.length === 0 ? (
              <p className="text-sm text-ellieGray/60">진행 중인 수업이 없습니다.</p>
            ) : (
              ongoingClasses.map((item) => (
                <div key={item.id} className="rounded-2xl border border-ellieGray/10 p-4">
                  <p className="text-sm font-semibold text-ellieGray">{item.name || '무제 클래스'}</p>
                  <p className="mt-1 text-xs text-ellieGray/60">상태: {item.status || '정보 없음'}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-soft">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ellieGray">최근 활동</h2>
              <p className="text-xs text-ellieGray/60">활동 로그가 최신 순으로 표시됩니다.</p>
            </div>
          </header>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-ellieGray/60">데이터를 불러오는 중입니다...</p>
            ) : error ? (
              <p className="text-sm text-red-500">활동 로그를 확인할 수 없습니다.</p>
            ) : recentActivities.length === 0 ? (
              <p className="text-sm text-ellieGray/60">최근 활동 기록이 없습니다.</p>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="rounded-2xl border border-ellieGray/10 p-4">
                  <p className="text-sm font-semibold text-ellieGray">{activity.title}</p>
                  {activity.detail ? (
                    <p className="mt-1 text-xs text-ellieGray/60">{activity.detail}</p>
                  ) : null}
                  <p className="mt-2 text-[11px] text-ellieGray/50">
                    담당자: {activity.actor || '미지정'} ·{' '}
                    {activity.createdTime
                      ? new Date(activity.createdTime).toLocaleString('ko-KR')
                      : '시간 정보 없음'}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function DashboardMetric({ title, value, subtitle, tone = 'default' }) {
  const toneClass =
    tone === 'warning'
      ? 'bg-amber-50 text-amber-600'
      : tone === 'success'
        ? 'bg-emerald-50 text-emerald-600'
        : 'bg-ellieGray/5 text-ellieGray';

  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft">
      <p className="text-xs font-medium text-ellieGray/60">{subtitle}</p>
      <p className="mt-2 text-lg font-semibold text-ellieGray">{title}</p>
      <p className={`mt-4 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}
