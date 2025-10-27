import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

type VideoItem = {
  id: number;
  title: string;
  url?: string | null;
  videoUrl?: string | null;
  description?: string | null;
  createdAt?: string | null;
};

type NoticeItem = {
  id: number;
  title: string;
  content: string;
  author?: string | null;
  createdAt?: string | null;
};

type MaterialItem = {
  id: number;
  title: string;
  fileUrl?: string | null;
  description?: string | null;
  mimeType?: string | null;
  createdAt?: string | null;
};

type ApiResponse<T> = {
  success?: boolean;
  items?: T[];
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return '';
  }

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  } catch (error) {
    console.error('[ClassDetail] Failed to parse date', error);
    return value;
  }
};

const getVideoLink = (video: VideoItem) => {
  if (typeof video.url === 'string' && video.url.trim().length > 0) {
    return video.url;
  }

  if (typeof video.videoUrl === 'string' && video.videoUrl.trim().length > 0) {
    return video.videoUrl;
  }

  return null;
};

function VideoPlayer(props: VideoItem) {
  const link = useMemo(() => getVideoLink(props), [props]);

  return (
    <article className="rounded-2xl bg-white p-4 shadow-soft">
      <header className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-ellieGray">{props.title}</h3>
        {props.description ? (
          <p className="text-sm leading-relaxed text-ellieGray/70">{props.description}</p>
        ) : null}
      </header>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center text-sm font-semibold text-ellieYellow hover:underline"
        >
          영상 보기
        </a>
      ) : (
        <p className="mt-3 text-sm text-ellieGray/60">영상 링크가 제공되지 않았습니다.</p>
      )}
      {props.createdAt ? (
        <p className="mt-3 text-xs text-ellieGray/50">{formatDate(props.createdAt)}</p>
      ) : null}
    </article>
  );
}

function NoticeCard({ title, content, author, createdAt }: NoticeItem) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-soft">
      <header className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-ellieGray">{title}</h3>
        {author ? <span className="text-xs text-ellieGray/60">작성자: {author}</span> : null}
      </header>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ellieGray/80">{content}</p>
      {createdAt ? <p className="mt-3 text-xs text-ellieGray/50">{formatDate(createdAt)}</p> : null}
    </article>
  );
}

function MaterialCard({ title, description, fileUrl, mimeType, createdAt }: MaterialItem) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-soft">
      <header className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-ellieGray">{title}</h3>
        {description ? (
          <p className="text-sm leading-relaxed text-ellieGray/70">{description}</p>
        ) : null}
      </header>
      {fileUrl ? (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center text-sm font-semibold text-ellieYellow hover:underline"
        >
          {mimeType === 'link' ? '링크 열기' : '자료 보기'}
        </a>
      ) : (
        <p className="mt-3 text-sm text-ellieGray/60">연결된 자료가 없습니다.</p>
      )}
      {createdAt ? <p className="mt-3 text-xs text-ellieGray/50">{formatDate(createdAt)}</p> : null}
    </article>
  );
}

const emptyStateMessage = {
  videos: '등록된 영상이 없습니다.',
  notices: '등록된 공지가 없습니다.',
  materials: '등록된 자료가 없습니다.',
} as const;

function ClassDetailPage() {
  const { id } = useParams();
  const classId = id ?? '';
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!classId) {
      setVideos([]);
      setNotices([]);
      setMaterials([]);
      return;
    }

    let cancelled = false;

    async function fetchContents() {
      setIsLoading(true);
      setError(null);

      try {
        const endpoints = ['videos', 'notices', 'materials'] as const;

        for (const endpoint of endpoints) {
          if (cancelled) {
            break;
          }

          const response = await fetch(`/api/${endpoint}?classId=${classId}`);
          if (!response.ok) {
            throw new Error(`${endpoint} 요청에 실패했습니다.`);
          }

          const data = (await response.json()) as ApiResponse<VideoItem | NoticeItem | MaterialItem>;
          if (!data?.success || cancelled) {
            continue;
          }

          if (endpoint === 'videos') {
            setVideos(Array.isArray(data.items) ? (data.items as VideoItem[]) : []);
          }
          if (endpoint === 'notices') {
            setNotices(Array.isArray(data.items) ? (data.items as NoticeItem[]) : []);
          }
          if (endpoint === 'materials') {
            setMaterials(Array.isArray(data.items) ? (data.items as MaterialItem[]) : []);
          }
        }
      } catch (fetchError) {
        console.error('[ClassDetail] Failed to fetch contents', fetchError);
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : '콘텐츠를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchContents();

    return () => {
      cancelled = true;
    };
  }, [classId]);

  const pageTitle = useMemo(() => {
    if (!classId) {
      return '강의 정보를 찾을 수 없습니다.';
    }

    return `클래스 ${classId}`;
  }, [classId]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-10">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">{pageTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">
          수강 중인 클래스의 영상, 공지, 자료를 한 곳에서 확인하세요.
        </p>
      </header>

      {error ? (
        <div className="rounded-3xl bg-red-50 p-6 text-sm text-red-600 shadow-soft">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="rounded-3xl bg-white p-6 text-center text-sm text-ellieGray shadow-soft">콘텐츠를 불러오는 중입니다…</div>
      ) : null}

      <section className="rounded-3xl bg-ivory p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-ellieGray">강의 영상</h2>
        <div className="mt-4 space-y-4">
          {videos.length ? videos.map((video) => <VideoPlayer key={video.id} {...video} />) : (
            <p className="text-sm text-ellieGray/70">{emptyStateMessage.videos}</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-ivory p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-ellieGray">공지사항</h2>
        <div className="mt-4 space-y-4">
          {notices.length ? notices.map((notice) => <NoticeCard key={notice.id} {...notice} />) : (
            <p className="text-sm text-ellieGray/70">{emptyStateMessage.notices}</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-ivory p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-ellieGray">수업 자료</h2>
        <div className="mt-4 space-y-4">
          {materials.length ? materials.map((material) => <MaterialCard key={material.id} {...material} />) : (
            <p className="text-sm text-ellieGray/70">{emptyStateMessage.materials}</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default ClassDetailPage;
