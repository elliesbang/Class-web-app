import { useCallback, useEffect, useState } from 'react';

import { getNotices } from '../lib/api';

const formatDisplayDate = (value) => {
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
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotices = useCallback(
    async (signal) => {
      if (signal?.aborted) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const fetched = await getNotices();

        if (signal?.aborted) {
          return;
        }

        setNotices(fetched);
      } catch (caught) {
        if (signal?.aborted) {
          return;
        }

        const message =
          caught instanceof Error ? caught.message : '공지사항을 불러오지 못했습니다.';
        setError(message);
        setNotices([]);
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchNotices(controller.signal).catch((caught) => {
      if (controller.signal.aborted) {
        return;
      }
      console.error('[Notices] 초기 공지 불러오기 실패', caught);
    });

    return () => {
      controller.abort();
    };
  }, [fetchNotices]);

  const handleRetry = () => {
    fetchNotices().catch((caught) => {
      console.error('[Notices] 공지 재시도 실패', caught);
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
        {isLoading ? (
          <article className="rounded-3xl bg-white p-5 shadow-soft">
            <p className="text-sm text-ellieGray/70">공지사항을 불러오는 중입니다...</p>
          </article>
        ) : error ? (
          <article className="rounded-3xl bg-white p-5 shadow-soft">
            <p className="text-sm text-red-500">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-3 rounded-full border border-ellieGray/20 px-4 py-2 text-xs font-semibold text-ellieGray transition-colors hover:bg-ellieGray/5"
            >
              다시 시도하기
            </button>
          </article>
        ) : notices.length === 0 ? (
          <article className="rounded-3xl bg-white p-5 shadow-soft">
            <p className="text-sm text-ellieGray/70">등록된 공지가 없습니다.</p>
          </article>
        ) : (
          notices.map((notice) => (
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
