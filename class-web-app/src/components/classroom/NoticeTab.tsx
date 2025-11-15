import React, { useMemo } from 'react';

const formatDateTime = (value: any) => {
  if (!value) {
    return '';
  }

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    console.error('[NoticeTab] Failed to format date', error);
    return '';
  }
};

const normaliseType = (value: any) => {
  if (typeof value === 'string') {
    return value.trim().toLowerCase();
  }
  if (value == null) {
    return '';
  }
  return String(value).trim().toLowerCase();
};

const normaliseNotices = (items: any) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => {
      const type = normaliseType(item?.type ?? item?.category ?? item?.contentType);
      return type === 'notice' || type === '공지' || type === 'announcement';
    })
    .map((item, index) => {
      const id = item?.id ?? item?.content_id ?? item?.contentId ?? `notice-${index}`;
      const titleCandidate = item?.title ?? item?.name ?? item?.content_title ?? `공지 ${index + 1}`;
      const contentCandidate = item?.description ?? item?.content ?? item?.text ?? '';
      const authorCandidate = item?.author ?? item?.writer ?? item?.creator ?? '';
      const createdAtCandidate = item?.created_at ?? item?.createdAt ?? item?.published_at ?? item?.publishedAt;

      return {
        id,
        title: typeof titleCandidate === 'string' ? titleCandidate : String(titleCandidate ?? ''),
        content:
          typeof contentCandidate === 'string'
            ? contentCandidate
            : contentCandidate != null
            ? String(contentCandidate)
            : '',
        author:
          typeof authorCandidate === 'string'
            ? authorCandidate
            : authorCandidate != null
            ? String(authorCandidate)
            : '',
        createdAt: createdAtCandidate ?? null,
      };
    });
};

function NoticeTab({ courseName, contents = [], isLoadingContents = false, contentError = null }: { [key: string]: any }) {
  const notices = useMemo(() => normaliseNotices(contents), [contents]);
  const isLoading = isLoadingContents;
  const error = contentError;

  const headerDescription = useMemo(() => {
    if (!courseName) {
      return '강의 운영에 필요한 최신 공지를 확인하세요.';
    }
    return `${courseName} 수업 관련 공지사항을 확인하세요.`;
  }, [courseName]);

  return (
    <div className="space-y-4 text-ellieGray">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold">공지</h2>
        <p className="text-sm leading-relaxed text-ellieGray/80">{headerDescription}</p>
      </header>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 shadow-soft">{error}</p>
      ) : null}

      {isLoading ? (
        <p className="rounded-2xl bg-white/70 px-4 py-3 text-center text-sm text-ellieGray/70 shadow-soft">
          공지를 불러오는 중입니다…
        </p>
      ) : null}

      {!isLoading && !error ? (
        notices.length > 0 ? (
          <ul className="space-y-4">
            {notices.map((notice: any, index: number) => {
              const createdAt = formatDateTime(notice?.createdAt);

              return (
                <li key={notice?.id ?? `notice-${index}`} className="rounded-2xl bg-white/70 px-5 py-6 shadow-soft">
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-ellieGray">
                      {notice?.title ?? `공지 ${index + 1}`}
                    </h3>
                    {notice?.author ? (
                      <p className="text-xs font-medium text-ellieGray/60">작성자: {notice.author}</p>
                    ) : null}
                    {notice?.content ? (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-ellieGray/80">{notice.content}</p>
                    ) : (
                      <p className="text-sm text-ellieGray/60">등록된 공지 내용이 없습니다.</p>
                    )}
                    {createdAt ? (
                      <p className="text-xs text-ellieGray/50">게시일: {createdAt}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl bg-white/70 px-5 py-6 text-center shadow-soft">
            <p className="text-sm leading-relaxed text-ellieGray/70">
              아직 {courseName ?? '해당'} 수업에 등록된 공지가 없습니다. 새로운 소식이 등록되면 이곳에서 안내드릴게요.
            </p>
          </div>
        )
      ) : null}
    </div>
  );
}

export default NoticeTab;
