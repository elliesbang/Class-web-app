import React, { useEffect, useMemo, useState } from 'react';

function readVodHistory() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem('vodHistory');
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[VodMyPage] failed to read vod history', error);
    return [];
  }
}

const resolveCategoryName = (item) => {
  if (!item || typeof item !== 'object') {
    return '';
  }
  return (
    item.category ||
    item.categoryName ||
    item['카테고리'] ||
    item['category(카테고리)'] ||
    ''
  )
    .toString()
    .trim();
};

const resolveTitle = (item) => {
  if (!item || typeof item !== 'object') {
    return '';
  }
  return (
    item.title ||
    item['title(강좌명)'] ||
    item.name ||
    ''
  )
    .toString()
    .trim();
};

export default function VodMyPage() {
  const [vods, setVods] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(() => readVodHistory());

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch('/.netlify/functions/getVOD')
      .then((response) => {
        if (!response.ok) {
          throw new Error('VOD 목록을 불러오지 못했습니다.');
        }
        return response.json();
      })
      .then((json) => {
        if (!isMounted) return;
        const list = Array.isArray(json) ? json : Array.isArray(json?.items) ? json.items : [];
        setVods(list);
      })
      .catch((caught) => {
        if (!isMounted) return;
        console.error('[VodMyPage] failed to load vod list', caught);
        setError(caught);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setHistory(readVodHistory());
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    vods.forEach((item) => {
      const name = resolveCategoryName(item);
      if (name) {
        set.add(name);
      }
    });
    return Array.from(set);
  }, [vods]);

  const filteredVods = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return vods.filter((item) => {
      const categoryName = resolveCategoryName(item);
      const matchesCategory = category ? categoryName === category : true;
      if (!matchesCategory) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      const title = resolveTitle(item).toLowerCase();
      const description = (item?.description || '')
        .toString()
        .toLowerCase();
      return title.includes(keyword) || description.includes(keyword);
    });
  }, [vods, category, search]);

  const recentVods = useMemo(() => {
    if (!history || history.length === 0) {
      return [];
    }

    return history
      .map((entry) => {
        if (typeof entry === 'string') {
          return vods.find((item) => item.id === entry) ?? null;
        }

        if (entry && typeof entry === 'object') {
          if (entry.id) {
            return vods.find((item) => item.id === entry.id) ?? entry;
          }

          return entry;
        }

        return null;
      })
      .filter(Boolean)
      .slice(0, 5);
  }, [history, vods]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">VOD 마이페이지</h1>
        <p className="mt-2 text-sm text-ellieGray/70">카테고리와 검색으로 원하는 강의를 찾아보세요.</p>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
            <label className="text-xs font-semibold text-ellieGray/70" htmlFor="vod-category">
              카테고리
            </label>
            <select
              id="vod-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-full border border-ellieGray/20 px-4 py-2 text-sm text-ellieGray outline-none focus:border-ellieOrange md:w-auto"
            >
              <option value="">전체</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 items-center gap-2">
            <input
              type="search"
              placeholder="VOD 검색"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-full border border-ellieGray/20 px-4 py-2 text-sm text-ellieGray outline-none focus:border-ellieOrange"
            />
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-3xl bg-red-50 p-5 text-sm text-red-600 shadow-soft">
          데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl bg-white p-6 shadow-soft md:col-span-2">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ellieGray">VOD 강의 목록</h2>
              <p className="text-xs text-ellieGray/60">노션 데이터베이스에서 실시간으로 불러옵니다.</p>
            </div>
          </header>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {loading ? (
              <p className="text-sm text-ellieGray/60">데이터를 불러오는 중입니다...</p>
            ) : filteredVods.length === 0 ? (
              <p className="text-sm text-ellieGray/60">해당 조건에 맞는 강의가 없습니다.</p>
            ) : (
              filteredVods.map((vod) => (
                <div key={vod.id} className="flex flex-col justify-between rounded-2xl border border-ellieGray/10 p-4">
                  <div>
                    <p className="text-sm font-semibold text-ellieGray">{resolveTitle(vod) || 'VOD 강의'}</p>
                    <p className="mt-1 text-xs text-ellieGray/60">카테고리: {resolveCategoryName(vod) || '미분류'}</p>
                    {vod.description ? (
                      <p className="mt-2 text-xs text-ellieGray/60">{vod.description}</p>
                    ) : null}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <a
                      href={vod.url || '#'}
                      className="rounded-full bg-ellieOrange px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-ellieOrange/90"
                    >
                      바로 시청
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-soft">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ellieGray">최근 시청한 VOD</h2>
              <p className="text-xs text-ellieGray/60">최대 5개까지 표시됩니다.</p>
            </div>
          </header>
          <div className="mt-4 space-y-3">
            {recentVods.length === 0 ? (
              <p className="text-sm text-ellieGray/60">최근 시청 기록이 없습니다.</p>
            ) : (
              recentVods.map((item, index) => (
                <div key={`${item.id || index}`} className="rounded-2xl border border-ellieGray/10 p-4">
                  <p className="text-sm font-semibold text-ellieGray">{resolveTitle(item) || 'VOD 강의'}</p>
                  <p className="mt-1 text-xs text-ellieGray/60">카테고리: {resolveCategoryName(item) || '미분류'}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
