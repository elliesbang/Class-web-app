import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

/**
 * Supabase 데이터 로딩용 공통 fetch 함수
 */
async function fetchData(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${url}`);
  return res.json();
}

function Home() {
  /**
   * 전체 공지
   */
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);

  /**
   * VOD 추천 영상
   */
  const [vodVideos, setVodVideos] = useState([]);
  const [loadingVod, setLoadingVod] = useState(true);

  /**
   * VOD 카테고리
   */
  const [vodCategories, setVodCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  /**
   * 전체 공지 로딩
   */
  useEffect(() => {
    async function loadNotices() {
      try {
        const json = await fetchData('/api/global-list');
        setNotices(json.data ?? []);
      } catch (e) {
        console.error('공지 불러오기 실패:', e);
      } finally {
        setLoadingNotices(false);
      }
    }
    loadNotices();
  }, []);

  /**
   * VOD 추천 영상 로딩
   */
  useEffect(() => {
    async function loadVodVideos() {
      try {
        const json = await fetchData('/api/vod-list');
        setVodVideos(json.data ?? []);
      } catch (e) {
        console.error('VOD 불러오기 실패:', e);
      } finally {
        setLoadingVod(false);
      }
    }
    loadVodVideos();
  }, []);

  /**
   * VOD 카테고리 로딩
   */
  useEffect(() => {
    async function loadCategories() {
      try {
        const json = await fetchData('/api/vod-categories');
        setVodCategories(json.data ?? []);
      } catch (e) {
        console.error('카테고리 불러오기 실패:', e);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  /**
   * 표시용 데이터
   */
  const visibleNotices = useMemo(() => notices.slice(0, 2), [notices]);
  const featuredVodVideos = useMemo(
    () => vodVideos.filter((video) => video.isRecommended).slice(0, 3),
    [vodVideos],
  );
  const featuredCategory = useMemo(
    () => vodCategories.find((category) => category.id === 'featured'),
    [vodCategories],
  );

  /**
   * 전체 로딩 플래그
   */
  const loading = loadingNotices || loadingVod || loadingCategories;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-ellieYellow px-6 py-8 text-ellieGray shadow-soft">
        <h1 className="text-2xl font-bold">엘리의방 클래스</h1>
        <p className="mt-3 text-sm leading-relaxed">
          엘리의방 홈페이지에서 바로 연결되는 강의실 플랫폼입니다. 모바일에 최적화된
          PWA 스타일로 편안하게 강의를 만나보세요.
        </p>
        <div className="mt-5 flex gap-3">
          <Link
            to="/classroom"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ellieGray shadow-md"
          >
            내부 강의실 바로가기
          </Link>
          <Link
            to="/vod"
            className="rounded-full border border-ellieGray/30 px-4 py-2 text-sm font-semibold text-ellieGray"
          >
            VOD 보기
          </Link>
        </div>
      </section>

      <section className="grid gap-4">
        {/* 추천 VOD 섹션 */}
        <article className="space-y-4 rounded-3xl bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ellieGray">
              {featuredCategory ? `${featuredCategory.name} VOD 추천` : '추천 VOD'}
            </h2>
            <Link to="/vod" className="text-xs font-semibold text-ellieGray/70 hover:text-ellieGray">
              전체 보기
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-ellieGray/60">콘텐츠를 불러오는 중입니다...</p>
          ) : featuredVodVideos.length === 0 ? (
            <p className="text-sm text-ellieGray/60">추천 VOD가 준비 중입니다.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {featuredVodVideos.map((video) => (
                <li key={video.id} className="flex gap-3 rounded-2xl bg-[#fffaf0] p-3">
                  <div className="h-20 w-28 overflow-hidden rounded-xl bg-ellieGray/10">
                    <img src={video.thumbnailUrl} alt="VOD 썸네일" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ellieGray">{video.title}</p>
                    {video.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-ellieGray/70">{video.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        {/* 전체 공지(2개) 섹션 */}
        <article className="space-y-4 rounded-3xl bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ellieGray">새로운 소식</h2>
            <Link to="/notices" className="text-xs font-semibold text-ellieGray/70 hover:text-ellieGray">
              공지 바로가기
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-ellieGray/60">공지 데이터를 불러오는 중입니다...</p>
          ) : visibleNotices.length === 0 ? (
            <p className="text-sm text-ellieGray/60">등록된 전체 공지가 없습니다.</p>
          ) : (
            <ul className="space-y-3">
              {visibleNotices.map((notice) => (
                <li key={notice.id} className="rounded-2xl bg-[#fffaf0] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ellieGray">{notice.title}</p>
                    <time className="text-xs text-ellieGray/60" dateTime={notice.createdAt}>
                      {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </time>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-ellieGray/70">{notice.content}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}

export default Home;