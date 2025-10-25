import { useCallback, useEffect, useMemo, useState } from 'react';

import { getClasses } from '../lib/api';
import { hasCourseAccess, subscribeCourseAccessChanges } from '../lib/course-access';

const formatDate = (value) => {
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

const formatDateRange = (startDate, endDate) => {
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

const getClassAccessKey = (classInfo) => {
  if (classInfo?.code && classInfo.code.trim().length > 0) {
    return classInfo.code;
  }

  if (classInfo?.name && classInfo.name.trim().length > 0) {
    return classInfo.name;
  }

  return '';
};

function MyPage() {
  const [allClasses, setAllClasses] = useState([]);
  const [visibleClasses, setVisibleClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateVisibleClasses = useCallback((classes) => {
    setVisibleClasses(
      classes.filter((item) => {
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
    async (signal) => {
      if (signal?.aborted) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const classes = await getClasses();

        if (signal?.aborted) {
          return;
        }

        setAllClasses(classes);
        updateVisibleClasses(classes);
      } catch (caught) {
        if (signal?.aborted) {
          return;
        }

        const message =
          caught instanceof Error ? caught.message : '강의 목록을 불러오지 못했습니다.';
        setError(message);
        setAllClasses([]);
        updateVisibleClasses([]);
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [updateVisibleClasses],
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchClasses(controller.signal).catch((caught) => {
      if (controller.signal.aborted) {
        return;
      }
      console.error('[MyPage] 강의 불러오기 실패', caught);
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
    fetchClasses().catch((caught) => {
      console.error('[MyPage] 강의 재요청 실패', caught);
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

        {isLoading ? (
          <p className="mt-4 text-sm text-ellieGray/70">강의 정보를 불러오는 중입니다...</p>
        ) : error ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-red-500">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-full border border-ellieGray/20 px-4 py-2 text-xs font-semibold text-ellieGray transition-colors hover:bg-ellieGray/5"
            >
              다시 시도하기
            </button>
          </div>
        ) : visibleClasses.length === 0 ? (
          <p className="mt-4 text-sm text-ellieGray/70">
            아직 접근 가능한 강의가 없습니다. 수강 중인 클래스가 보이지 않는다면 관리자에게 문의해 주세요.
          </p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm text-ellieGray/80">
            {visibleClasses.map((course) => {
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
