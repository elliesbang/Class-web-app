import React from 'react';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const NoticeTab = ({ items = [] }) => {
  if (!items.length) {
    return <p className="text-sm text-ellieGray/70">표시할 공지가 없습니다.</p>;
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl bg-white p-4 shadow-soft">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base font-semibold text-ellieGray">{item.title || '제목 없는 공지'}</p>
            <span className="text-xs text-ellieGray/60">{formatDate(item.created_at)}</span>
          </div>
          {item.description ? (
            <p className="mt-2 text-sm leading-relaxed text-ellieGray/80">{item.description}</p>
          ) : null}
          {item.content_url ? (
            <a
              href={item.content_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center text-xs font-semibold text-[#ff9900]"
            >
              자세히 보기 →
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
};

export default NoticeTab;
