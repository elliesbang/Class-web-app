import { useEffect, useMemo, useState } from 'react';

import ContentEditor, { type TabConfig } from './components/ContentEditor';

import { supabase } from '@/lib/supabaseClient';

type CategoryOption = { id: string; name: string };

type CategoryMap = {
  class: CategoryOption[];
  vod: CategoryOption[];
};

const TAB_ITEMS: TabConfig[] = [
  {
    key: 'global',
    label: '전체 공지',
    type: 'global',
    requiresCategory: false,
  },
  {
    key: 'classroomVideo',
    label: '강의실 영상',
    type: 'video',
    requiresCategory: true,
    categorySource: 'class',
  },
  {
    key: 'vodVideo',
    label: 'VOD 영상',
    type: 'vod',
    requiresCategory: true,
    categorySource: 'vod',
  },
  {
    key: 'material',
    label: '자료',
    type: 'material',
    requiresCategory: true,
    categorySource: 'class',
  },
  {
    key: 'classroomNotice',
    label: '강의실 공지',
    type: 'notice',
    requiresCategory: true,
    categorySource: 'class',
  },
];

const ContentManage = () => {
  const [categories, setCategories] = useState<CategoryMap>({ class: [], vod: [] });
  const [categorySelections, setCategorySelections] = useState<{ class?: string; vod?: string }>({});
  const [activeTab, setActiveTab] = useState<TabConfig>(TAB_ITEMS[0]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      setCategoryError(null);
      try {
        const [classCategory, vodCategory] = await Promise.all([
          supabase.from('class_category').select('id, name').order('name', { ascending: true }),
          supabase.from('vod_category').select('id, name').order('name', { ascending: true }),
        ]);

        if (!isMounted) return;

        if (classCategory.error) throw classCategory.error;
        if (vodCategory.error) throw vodCategory.error;

        const classOptions: CategoryOption[] = (classCategory.data ?? []).map((item) => ({
          id: String(item.id),
          name: item.name ?? '',
        }));
        const vodOptions: CategoryOption[] = (vodCategory.data ?? []).map((item) => ({
          id: String(item.id),
          name: item.name ?? '',
        }));

        setCategories({ class: classOptions, vod: vodOptions });
        setCategorySelections({
          class: classOptions[0]?.id,
          vod: vodOptions[0]?.id,
        });
      } catch (error) {
        if (!isMounted) return;
        console.error('[content-manage] failed to load categories', error);
        setCategoryError('카테고리를 불러오지 못했습니다.');
        setCategories({ class: [], vod: [] });
      } finally {
        if (isMounted) setIsLoadingCategories(false);
      }
    };

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeCategories = useMemo(() => {
    if (!activeTab.requiresCategory || !activeTab.categorySource) return [];
    return categories[activeTab.categorySource] ?? [];
  }, [activeTab, categories]);

  const selectedCategoryId = useMemo(() => {
    if (!activeTab.requiresCategory || !activeTab.categorySource) return undefined;
    return categorySelections[activeTab.categorySource];
  }, [activeTab, categorySelections]);

  const handleCategoryChange = (source: 'class' | 'vod', value: string) => {
    setCategorySelections((prev) => ({ ...prev, [source]: value }));
  };

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-white px-6 py-4 shadow-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-ellieGray">콘텐츠 관리</h1>
            <p className="text-sm text-ellieGray/70">카테고리와 콘텐츠를 관리합니다.</p>
          </div>
        </div>
      </header>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <div className="mb-6 flex flex-wrap gap-2">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab.key === tab.key
                  ? 'bg-ellieOrange text-white shadow'
                  : 'bg-ellieGray/10 text-ellieGray hover:bg-ellieGray/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ContentEditor
          tab={activeTab}
          categories={activeCategories}
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={(value) => activeTab.categorySource && handleCategoryChange(activeTab.categorySource, value)}
          isLoadingCategories={isLoadingCategories}
          categoryError={categoryError}
        />
      </div>
    </div>
  );
};

export default ContentManage;
