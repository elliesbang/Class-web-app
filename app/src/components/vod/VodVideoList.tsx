import { useEffect, useState } from 'react';

type VodVideoListProps = {
  selectedCategoryId: string;
};

type VodVideoItem = {
  id: string | number;
  title?: string;
  description?: string;
  url?: string;
  created_at?: string;
};

const VodVideoList = ({ selectedCategoryId }: VodVideoListProps) => {
  const [items, setItems] = useState<VodVideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCategoryId) {
      setItems([]);
      return;
    }

    let isMounted = true;

    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/vod-list?category_id=${encodeURIComponent(selectedCategoryId)}`);
        if (!response.ok) {
          throw new Error('VOD 목록을 불러올 수 없습니다.');
        }
        const data = await response.json();
        if (!isMounted) return;
        const payloadItems = Array.isArray(data)
          ? data
          : Array.isArray((data as Record<string, any>)?.results)
            ? (data as Record<string, any>).results
            : [];
        setItems(payloadItems as VodVideoItem[]);
      } catch (caught) {
        if (!isMounted) return;
        console.error('[vod] list load failed', caught);
        setError('목록을 불러오지 못했습니다.');
        setItems([]);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    void fetchVideos();

    return () => {
      isMounted = false;
    };
  }, [selectedCategoryId]);

  if (!selectedCategoryId) {
    return <p className="text-sm text-ellieGray/70">카테고리를 먼저 선택해주세요.</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-ellieGray/70">불러오는 중입니다...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (!items.length) {
    return <p className="text-sm text-ellieGray/70">등록된 영상이 없습니다.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-ellieGray/10 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-ellieGray">{item.title ?? '제목 없음'}</h3>
              {item.created_at ? (
                <p className="text-xs text-ellieGray/60">
                  {new Date(item.created_at).toLocaleDateString('ko-KR')}
                </p>
              ) : null}
            </div>
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-ellieOrange hover:underline"
              >
                바로보기
              </a>
            ) : null}
          </div>
          {item.description ? <p className="mt-2 text-sm text-ellieGray/70">{item.description}</p> : null}
        </article>
      ))}
    </div>
  );
};

export default VodVideoList;
