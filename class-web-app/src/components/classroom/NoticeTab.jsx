import { useEffect, useMemo, useState } from 'react';

const parseJsonResponse = async (response, contextLabel) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error(`[${contextLabel}] JSON parse error`, {
      url: response.url,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: text,
      error,
    });
    throw error;
  }
};

const normaliseItems = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  const candidates = [payload.items, payload.data, payload.results, payload.notices];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }
  return [];
};

const formatDateTime = (value) => {
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

const getItemKey = (item, index) => {
  const candidates = [item?.id, item?.noticeId, item?.slug, item?.title];
  for (const candidate of candidates) {
    if (candidate) {
      return candidate;
    }
  }
  return `notice-${index}`;
};

function NoticeTab({ courseId, courseName }) {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId) {
      setNotices([]);
      setError('강의 정보를 불러오지 못했습니다.');
      return;
    }

    let cancelled = false;

    const fetchNotices = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/classes/${courseId}/notices`);
        if (!response.ok) {
          throw new Error(`Failed to fetch notices. status=${response.status}`);
        }

        const payload = await parseJsonResponse(response, 'NoticeTab');
        if (cancelled) {
          return;
        }
        setNotices(normaliseItems(payload));
      } catch (fetchError) {
        console.error('[NoticeTab] Failed to load notices', fetchError);
        if (!cancelled) {
          setError('공지사항을 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
          setNotices([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchNotices();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

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
            {notices.map((notice, index) => {
              const key = getItemKey(notice, index);
              const description =
                typeof notice?.content === 'string' && notice.content.trim().length > 0
                  ? notice.content
                  : typeof notice?.description === 'string'
                  ? notice.description
                  : '';
              const author =
                typeof notice?.author === 'string'
                  ? notice.author
                  : typeof notice?.writer === 'string'
                  ? notice.writer
                  : '';
              const createdAt = formatDateTime(notice?.createdAt ?? notice?.publishedAt);

              return (
                <li key={key} className="rounded-2xl bg-white/70 px-5 py-6 shadow-soft">
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-ellieGray">
                      {notice?.title ?? `공지 ${index + 1}`}
                    </h3>
                    {author ? (
                      <p className="text-xs font-medium text-ellieGray/60">작성자: {author}</p>
                    ) : null}
                    {description ? (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-ellieGray/80">{description}</p>
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
