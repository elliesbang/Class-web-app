import { useEffect, useMemo, useState } from 'react';

import { fetchCategories } from '../../../lib/api';
import ContentManager, { type TabKey } from '../components/ContentManager';

type CategoryRecord = { id: number; name: string; parent_id: number | null };

const ContentListPage = () => {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('globalNotice');

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetchCategories({ signal: controller.signal })
      .then((records) => {
        setCategories(records);
        const firstSubCategory = records
          .filter((item) => item.parent_id !== null)
          .sort((a, b) => a.name.localeCompare(b.name, 'ko', { sensitivity: 'base' }))
          .at(0);
        setSelectedCategoryId((firstSubCategory?.id ?? '').toString());
      })
      .catch((caught) => {
        console.error('[content] failed to fetch categories', caught);
        setError('카테고리를 불러오지 못했습니다.');
        setCategories([]);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, []);

  const categoryOptions = useMemo(
    () =>
      categories
        .filter((item) => item.parent_id !== null)
        .sort((a, b) => a.name.localeCompare(b.name, 'ko', { sensitivity: 'base' }))
        .map((item) => ({
          id: item.id.toString(),
          name: item.name,
        })),
    [categories],
  );

  const shouldShowClassCategory =
    activeTab === 'classroomVideo' || activeTab === 'material' || activeTab === 'classroomNotice';

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-white px-6 py-4 shadow-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-ellieGray">콘텐츠 관리</h1>
            <p className="text-sm text-ellieGray/70">class_category 테이블의 카테고리를 기준으로 콘텐츠를 관리합니다.</p>
          </div>
          {shouldShowClassCategory ? (
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <label className="text-xs font-semibold text-ellieGray/70" htmlFor="content-category-select">
                카테고리
              </label>
              <select
                id="content-category-select"
                value={selectedCategoryId}
                onChange={(event) => setSelectedCategoryId(event.target.value)}
                disabled={isLoading || categoryOptions.length === 0}
                className="rounded-full border border-ellieGray/20 px-4 py-2 text-sm text-ellieGray outline-none focus:border-ellieOrange"
              >
                {isLoading ? (
                  <option value="">카테고리 불러오는 중...</option>
                ) : error ? (
                  <option value="">카테고리를 불러올 수 없습니다.</option>
                ) : categoryOptions.length === 0 ? (
                  <option value="">카테고리가 없습니다.</option>
                ) : (
                  categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : null}
        </div>
      </header>

      <ContentManager activeTab={activeTab} onTabChange={setActiveTab} selectedClassId={selectedCategoryId} />
    </div>
  );
};

export default ContentListPage;
