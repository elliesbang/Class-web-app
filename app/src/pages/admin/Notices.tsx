import React, { useMemo } from 'react';

import { useSheetsData } from '../../contexts/SheetsDataContext';

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
  const { contentCollections, loading } = useSheetsData();
  const notices = useMemo(
    () => contentCollections.globalNotices.filter((notice) => notice.isVisible),
    [contentCollections.globalNotices],
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
        ) : notices.length === 0 ? (
          <article className="rounded-3xl bg-white p-5 shadow-soft">
            <p className="text-sm text-ellieGray/70">등록된 공지가 없습니다.</p>
          </article>
        ) : (
          notices.map((notice) => (
            <article key={notice.id} className="rounded-3xl bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-ellieGray">{notice.title}</h2>
                <time className="text-xs text-ellieGray/60" dateTime={notice.createdAt}>
                  {formatDisplayDate(notice.createdAt)}
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
