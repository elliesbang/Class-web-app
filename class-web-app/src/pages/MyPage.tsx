import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { hasCourseAccess, subscribeCourseAccessChanges } from '../lib/course-access';

const formatDate = (value: any) => {
  if (!value) {
    return null;
  }

  try {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    }
  } catch (error) {
    console.warn('[MyPage] failed to format date', value, error);
  }

  return typeof value === 'string' ? value : String(value);
};

const formatDateRange = (startDate: any, endDate: any) => {
  const formattedStart = formatDate(startDate);
  const formattedEnd = formatDate(endDate);

  if (formattedStart && formattedEnd) {
    return `${formattedStart} ~ ${formattedEnd}`;
  }

  if (formattedStart) {
    return `${formattedStart} 시작`;
  }

  if (formattedEnd) {
    return `${formattedEnd} 종료`;
  }

  return null;
};

const getClassAccessKey = (classInfo: any) => {
  if (classInfo?.code && classInfo.code.trim().length > 0) {
    return classInfo.code;
  }

  if (classInfo?.name && classInfo.name.trim().length > 0) {
    return classInfo.name;
  }

  return '';
};

function MyPage() {
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [visibleClasses, setVisibleClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const updateVisibleClasses = useCallback((classes: any[]) => {
    setVisibleClasses(
      classes.filter((item: any) => {
        try {
          return hasCourseAccess(getClassAccessKey(item));
        } catch (caught) {
          console.warn('[MyPage] 강의 접근 여부 확인 실패', caught);
          return true;
        }
      }),
    );
  }, []);

  const fetchClasses = useCallback(
    async (signal?: any) => {
      if (signal?.aborted) {
        return;
      }

      setIsLoading(false);
      setError(null);
      setAllClasses([]);
      updateVisibleClasses([]);
    },
    [updateVisibleClasses],
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchClasses(controller.signal).catch(() => {
      // 데이터 로딩 비활성화
    });

    return () => {
      controller.abort();
    };
  }, [fetchClasses]);

  useEffect(() => {
    return subscribeCourseAccessChanges(() => {
      updateVisibleClasses(allClasses);
    });
  }, [allClasses, updateVisibleClasses]);

  const handleRetry = () => {
    fetchClasses().catch(() => {
      // 데이터 로딩 비활성화
    });
  };

  const activeClassCount = useMemo(
    () => visibleClasses.filter((item) => item.isActive !== false).length,
    [visibleClasses],
  );

  return (
    <div className="space-y-5">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">마이페이지</h1>
        <p className="mt-2 text-sm text-ellieGray/70">
          내 강의 목록과 수강 현황을 확인하고 개인 정보를 관리하세요.
        </p>
      </header>
      <section className="rounded-3xl bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-ellieGray">나의 강의</h2>
          {!isLoading && !error ? (
            <span className="text-xs font-medium text-ellieGray/60">
              {visibleClasses.length}개 중 진행 중 {activeClassCount}개
            </span>
          ) : null}
        </div>

        {/* 데이터 로딩 및 오류 안내 비활성화 */}
        {!isLoading && !error ? (
          <p className="mt-4 text-sm text-ellieGray/70">
            아직 접근 가능한 강의가 없습니다. 수강 중인 클래스가 보이지 않는다면 관리자에게 문의해 주세요.
          </p>
        ) : !isLoading && error ? null : (
          <ul className="mt-4 space-y-3 text-sm text-ellieGray/80">
            {visibleClasses.map((course: any) => {
              const periodLabel = formatDateRange(course.startDate, course.endDate);
              const statusLabel = course.isActive === false ? '종료됨' : '진행 중';

              return (
                <li key={course.id} className="rounded-2xl bg-ellieGray/5 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-ellieGray">{course.name}</span>
                    <span className="text-xs font-medium text-ellieGray/60">{statusLabel}</span>
                  </div>
                  <div className="mt-1 text-xs text-ellieGray/60">
                    {course.category ? <span>{course.category}</span> : null}
                    {course.category && periodLabel ? <span className="mx-1">·</span> : null}
                    {periodLabel ? <span>{periodLabel}</span> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="rounded-3xl bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ellieGray">계정 설정</h2>
        <p className="mt-2 text-sm text-ellieGray/70">
          프로필, 알림, 결제 수단 등을 손쉽게 관리할 수 있습니다.
        </p>
      </section>
    </div>
  );
}

export default MyPage;
