import { useEffect, useMemo, useState } from 'react';

const getVideoLink = (video) => {
  if (!video || typeof video !== 'object') {
    return null;
  }

  const candidates = [video.url, video.videoUrl, video.link, video.linkUrl, video.streamUrl];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return null;
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
    console.error('[VideoTab] Failed to format date', error);
    return '';
  }
};

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
  const candidates = [payload.items, payload.data, payload.results, payload.videos];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }
  return [];
};

const getItemKey = (item, index) => {
  const candidates = [item?.id, item?.videoId, item?.slug, item?.url, item?.title];
  for (const candidate of candidates) {
    if (candidate) {
      return candidate;
    }
  }
  return `video-${index}`;
};

function VideoTab({ courseId, courseName }) {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId) {
      setVideos([]);
      setError('강의 정보를 불러오지 못했습니다.');
      return;
    }

    let cancelled = false;

    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/classes/${courseId}/videos`);
        if (!response.ok) {
          throw new Error(`Failed to fetch videos. status=${response.status}`);
        }

        const payload = await parseJsonResponse(response, 'VideoTab');
        if (cancelled) {
          return;
        }
        setVideos(normaliseItems(payload));
      } catch (fetchError) {
        console.error('[VideoTab] Failed to load videos', fetchError);
        if (!cancelled) {
          setError('영상 정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
          setVideos([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchVideos();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const headerDescription = useMemo(() => {
    if (!courseName) {
      return '수업 영상을 확인하고 복습해보세요.';
    }
    return `${courseName} 수업 영상을 확인하고 복습해보세요.`;
  }, [courseName]);

  return (
    <div className="space-y-4 text-ellieGray">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold">영상 보기</h2>
        <p className="text-sm leading-relaxed text-ellieGray/80">{headerDescription}</p>
      </header>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 shadow-soft">{error}</p>
      ) : null}

      {isLoading ? (
        <p className="rounded-2xl bg-white/70 px-4 py-3 text-center text-sm text-ellieGray/70 shadow-soft">
          영상 정보를 불러오는 중입니다…
        </p>
      ) : null}

      {!isLoading && !error ? (
        videos.length > 0 ? (
          <ul className="space-y-4">
            {videos.map((video, index) => {
              const key = getItemKey(video, index);
              const link = getVideoLink(video);
              const description =
                typeof video?.description === 'string' && video.description.trim().length > 0
                  ? video.description
                  : typeof video?.summary === 'string'
                  ? video.summary
                  : '';
              const createdAt = formatDateTime(video?.createdAt ?? video?.publishedAt);

              return (
                <li key={key} className="rounded-2xl bg-white/70 px-5 py-6 shadow-soft">
                  <h3 className="text-base font-semibold text-ellieGray">
                    {video?.title ?? `영상 ${index + 1}`}
                  </h3>
                  {description ? (
                    <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">{description}</p>
                  ) : null}
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ellieYellow hover:underline"
                    >
                      영상 열기
                    </a>
                  ) : (
                    <p className="mt-4 text-sm text-ellieGray/60">영상 링크가 준비되지 않았습니다.</p>
                  )}
                  {createdAt ? (
                    <p className="mt-3 text-xs text-ellieGray/50">업데이트: {createdAt}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl bg-white/70 px-5 py-6 text-center shadow-soft">
            <p className="text-sm leading-relaxed text-ellieGray/70">
              아직 {courseName ?? '해당'} 수업에 등록된 영상이 없습니다. 새로운 콘텐츠가 준비되면 이곳에서 안내드릴게요.
            </p>
          </div>
        )
      ) : null}
    </div>
  );
}

export default VideoTab;
