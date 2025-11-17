import React, { useEffect, useMemo, useState } from 'react';

type VodCategory = { id: number; name: string; order_num: number };
type VodContent = {
  id: string;
  title: string;
  description?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
  createdAt?: string | null;
};

function VOD() {
  const [categories, setCategories] = useState<VodCategory[]>([]);
  const [vodContents, setVodContents] = useState<VodContent[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingContents, setLoadingContents] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await fetch('/api/vod-category');
        if (!response.ok) {
          throw new Error('Failed to fetch VOD categories');
        }
        const data = (await response.json()) as VodCategory[];
        setCategories(data);
        if (data.length > 0) {
          setActiveCategoryId((prev) => (prev == null ? data[0].id : prev));
        }
      } catch (error) {
        console.error('[VOD] VOD categories fetch failed', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    void loadCategories();
  }, []);

  useEffect(() => {
    if (activeCategoryId == null) {
      setVodContents([]);
      return;
    }

    const loadVodContents = async () => {
      setLoadingContents(true);
      try {
        const response = await fetch(`/api/vod?vod_category_id=${activeCategoryId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch VOD contents');
        }
        const data = (await response.json()) as Array<{
          id: string | number;
          title: string;
          description?: string | null;
          content_url?: string | null;
          thumbnail_url?: string | null;
          created_at?: string | null;
        }>;

        setVodContents(
          data.map((item) => ({
            id: String(item.id),
            title: item.title,
            description: item.description ?? '',
            videoUrl: item.content_url ?? '',
            thumbnailUrl: item.thumbnail_url ?? '',
            createdAt: item.created_at ?? null,
          })),
        );
      } catch (error) {
        console.error('[VOD] VOD contents fetch failed', error);
        setVodContents([]);
      } finally {
        setLoadingContents(false);
      }
    };

    void loadVodContents();
  }, [activeCategoryId]);

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeCategoryId),
    [activeCategoryId, categories],
  );
  const videos = useMemo(() => vodContents, [vodContents]);

  return (
    <div className="space-y-4">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">VOD</h1>
        <p className="mt-2 text-sm text-ellieGray/70">
          언제 어디서나 다시 볼 수 있는 엘리의방 VOD 콘텐츠를 만나보세요.
        </p>
      </header>

      <section className="rounded-3xl bg-white p-5 shadow-soft">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isActive = category.id === activeCategoryId;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategoryId(category.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#ffd331] text-ellieGray shadow-soft'
                    : 'bg-[#fffaf0] text-ellieGray/70 hover:bg-[#ffd331]/80 hover:text-ellieGray'
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-3 text-sm text-ellieGray/70">
          {loadingCategories ? (
            <p>VOD 데이터를 불러오는 중입니다...</p>
          ) : activeCategory ? (
            <p>
              {activeCategory.name} 카테고리의 총 {videos.length}개 콘텐츠를 확인하세요.
            </p>
          ) : (
            <p>카테고리를 선택하면 해당 VOD 목록이 표시됩니다.</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        {loadingContents ? (
          <article className="rounded-3xl bg-white p-5 text-sm text-ellieGray/70 shadow-soft">
            VOD를 불러오는 중입니다...
          </article>
        ) : videos.length === 0 ? (
          <article className="rounded-3xl bg-white p-5 text-sm text-ellieGray/70 shadow-soft">
            선택한 카테고리에 등록된 VOD가 없습니다.
          </article>
        ) : (
          videos.map((video) => (
            <article key={video.id} className="rounded-3xl bg-white p-5 shadow-soft">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="aspect-video w-full overflow-hidden rounded-2xl bg-ellieGray/10 md:w-64">
                  <img src={video.thumbnailUrl} alt="VOD 썸네일" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-lg font-semibold text-ellieGray">{video.title}</h2>
                    <span className="text-xs text-ellieGray/60">
                      {video.createdAt ? new Date(video.createdAt).toLocaleDateString('ko-KR') : ''}
                    </span>
                  </div>
                  {video.description ? (
                    <p className="text-sm leading-relaxed text-ellieGray/70">{video.description}</p>
                  ) : null}
                  <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-[#ffd331] px-5 py-2 text-sm font-semibold text-ellieGray shadow-soft transition-colors hover:bg-[#e6bd2c]"
                  >
                    영상 바로보기
                  </a>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default VOD;
