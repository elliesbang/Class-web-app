import React, { useMemo } from 'react';

const getVideoLink = (video: any) => {
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
    console.error('[VideoTab] Failed to format date', error);
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

const normaliseVideos = (items: any) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => {
      const type = normaliseType(item?.type ?? item?.category ?? item?.contentType);
      return type === 'video' || type === '영상' || type === 'videos';
    })
    .map((item, index) => {
      const id = item?.id ?? item?.content_id ?? item?.contentId ?? `video-${index}`;
      const titleCandidate =
        item?.title ?? item?.name ?? item?.content_title ?? item?.contentTitle ?? `영상 ${index + 1}`;
      const descriptionCandidate =
        item?.description ?? item?.summary ?? item?.content ?? item?.text ?? '';
      const urlCandidate =
        item?.file_url ?? item?.fileUrl ?? item?.url ?? item?.link ?? item?.linkUrl ?? null;
      const createdAtCandidate =
        item?.created_at ?? item?.createdAt ?? item?.published_at ?? item?.publishedAt ?? null;

      return {
        id,
        title: typeof titleCandidate === 'string' ? titleCandidate : String(titleCandidate ?? ''),
        description:
          typeof descriptionCandidate === 'string'
            ? descriptionCandidate
            : descriptionCandidate != null
            ? String(descriptionCandidate)
            : '',
        url: urlCandidate,
        createdAt: createdAtCandidate,
      };
    });
};

function VideoTab({ courseName, contents = [], isLoadingContents = false, contentError = null }: { [key: string]: any }) {
  const videos = useMemo(() => normaliseVideos(contents), [contents]);
  const isLoading = isLoadingContents;
  const error = contentError;

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
            {videos.map((video: any, index: number) => {
              const link = getVideoLink(video);
              const description =
                typeof video?.description === 'string' && video.description.trim().length > 0
                  ? video.description
                  : '';
              const createdAt = formatDateTime(video?.createdAt);

              return (
                <li key={video?.id ?? `video-${index}`} className="rounded-2xl bg-white/70 px-5 py-6 shadow-soft">
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
            <p className="text-sm leading-relaxed text-ellieGray/70">등록된 영상이 없습니다.</p>
          </div>
        )
      ) : null}
    </div>
  );
}

export default VideoTab;
