import React, { useEffect, useMemo, useState } from 'react';

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

type GlobalNoticeRecord = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_visible: boolean;
};

function Notices() {
  const [notices, setNotices] = useState<GlobalNoticeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchNotices = async () => {
      try {
        const response = await fetch('/api/content/global-notice/list', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('공지 데이터를 불러오지 못했습니다.');
        }

        const payload = await response.json();
        const rawList = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.notices)
          ? payload.notices
          : Array.isArray(payload)
          ? payload
          : [];

        const parsedNotices: GlobalNoticeRecord[] = rawList
          .map((item: any) => ({
            id: String(item?.id ?? ''),
            title: item?.title ?? '',
            content: item?.content ?? '',
            created_at: item?.created_at ?? '',
            is_visible: Boolean(item?.is_visible),
          }))
          .filter((item) => item.id && item.title);

        if (!controller.signal.aborted) {
          setNotices(parsedNotices);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.warn('[Notices] failed to fetch notices', error);
        setNotices([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchNotices();

    return () => {
      controller.abort();
    };
  }, []);

  const visibleNotices = useMemo(
    () => notices.filter((notice) => notice.is_visible),
    [notices],
  );

  return (
    <div className="space-y-4">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">공지사항</h1>
        <p className="mt-2 text-sm text-ellieGray/70">
          엘리의방 클래스의 새로운 소식과 업데이트를 확인하세요.
        </p>
      </header>
      <section className="space-y-4">
        {loading ? (
          <article className="rounded-3xl bg-white p-5 shadow-soft">
            <p className="text-sm text-ellieGray/70">공지 데이터를 불러오는 중입니다...</p>
          </article>
        ) : visibleNotices.length === 0 ? (
          <article className="rounded-3xl bg-white p-5 shadow-soft">
            <p className="text-sm text-ellieGray/70">등록된 공지가 없습니다.</p>
          </article>
        ) : (
          visibleNotices.map((notice) => (
            <article key={notice.id} className="rounded-3xl bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-ellieGray">{notice.title}</h2>
                <time className="text-xs text-ellieGray/60" dateTime={notice.created_at}>
                  {formatDisplayDate(notice.created_at)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ellieGray/70">{notice.content}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-ellieGray/60">
                <span>홈 &middot; 공지 탭 노출</span>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default Notices;
