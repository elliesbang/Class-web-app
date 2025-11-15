import React, { useCallback, useEffect, useState } from 'react';

const formatDisplayDate = (value: any) => {
  if (!value) {
    return '';
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
    console.warn('[Notices] failed to format date value', value, error);
  }

  return value;
};

function Notices() {
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchNotices = useCallback(
    async (signal?: any) => {
      if (signal?.aborted) {
        return;
      }

      setIsLoading(false);
      setError(null);
      setNotices([]);
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchNotices(controller.signal).catch(() => {
      // 데이터 로딩 비활성화
    });

    return () => {
      controller.abort();
    };
  }, [fetchNotices]);

  const handleRetry = () => {
    fetchNotices().catch(() => {
      // 데이터 로딩 비활성화
    });
  };

  return (
    <div className="space-y-4">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">공지사항</h1>
        <p className="mt-2 text-sm text-ellieGray/70">
          엘리의방 클래스의 새로운 소식과 업데이트를 확인하세요.
        </p>
      </header>
      <section className="space-y-4">
        {/* 데이터 로딩 및 오류 안내 비활성화 */}
        {notices.length === 0 ? (
          <article className="rounded-3xl bg-white p-5 shadow-soft">
            <p className="text-sm text-ellieGray/70">등록된 공지가 없습니다.</p>
          </article>
        ) : (
          notices.map((notice: any) => (
            <article key={notice.id} className="rounded-3xl bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-ellieGray">{notice.title}</h2>
                {notice.createdAt ? (
                  <time className="text-xs text-ellieGray/60" dateTime={notice.createdAt}>
                    {formatDisplayDate(notice.createdAt)}
                  </time>
                ) : null}
              </div>
              {notice.content ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ellieGray/70">
                  {notice.content}
                </p>
              ) : null}
              {notice.author ? (
                <p className="mt-3 text-xs text-ellieGray/50">작성자: {notice.author}</p>
              ) : null}
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default Notices;
