import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { getCategories } from '@/lib/api/category';

import ClassroomNoticeForm from './ClassroomNoticeForm';
import ClassroomVideoForm from './ClassroomVideoForm';
import ContentList from './ContentList';
import GlobalNoticeForm from './GlobalNoticeForm';
import MaterialForm from './MaterialForm';
import VodVideoForm from './VodVideoForm';

export type TabKey = 'globalNotice' | 'classroomVideo' | 'material' | 'classroomNotice' | 'vodVideo';
export type ContentApiType = 'global' | 'classroomVideo' | 'material' | 'classroomNotice' | 'vod';

export type CategoryOption = {
  id: string;
  name: string;
};

export type BaseFormProps = {
  onSaved: () => void | Promise<void>;
  editingItem: Record<string, any> | null;
  onCancelEdit: () => void;
  categoryId?: string;
  categoryOptions?: CategoryOption[];
  onCategoryChange?: (value: string) => void;
  isCategoryLoading?: boolean;
  categoryError?: string | null;
};

type TabDefinition = {
  key: TabKey;
  label: string;
  apiType: ContentApiType;
  showCategory: boolean;
  FormComponent: ComponentType<BaseFormProps>;
};

const TAB_DEFINITIONS: TabDefinition[] = [
  { key: 'globalNotice', label: '전체 공지', apiType: 'global', showCategory: false, FormComponent: GlobalNoticeForm },
  { key: 'classroomVideo', label: '강의실 영상', apiType: 'classroomVideo', showCategory: true, FormComponent: ClassroomVideoForm },
  { key: 'material', label: '자료', apiType: 'material', showCategory: true, FormComponent: MaterialForm },
  { key: 'classroomNotice', label: '강의실 공지', apiType: 'classroomNotice', showCategory: true, FormComponent: ClassroomNoticeForm },
  { key: 'vodVideo', label: 'VOD', apiType: 'vod', showCategory: false, FormComponent: VodVideoForm },
];

type CategoryRecord = { id: number; name: string; parent_id: number | null };

const ContentTabs = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('globalNotice');
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [editingItem, setEditingItem] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      setIsCategoryLoading(true);
      setCategoryError(null);

      try {
        const records = await getCategories();
        if (!isMounted) return;
        setCategories(records);
      } catch (error) {
        if (!isMounted) return;
        console.error('[content] failed to load class categories', error);
        setCategories([]);
        setCategoryError('카테고리를 불러오지 못했습니다.');
      } finally {
        if (!isMounted) return;
        setIsCategoryLoading(false);
      }
    };

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const categoryOptions = useMemo<CategoryOption[]>(
    () =>
      categories
        .filter((category) => category.parent_id !== null)
        .sort((a, b) => a.name.localeCompare(b.name, 'ko', { sensitivity: 'base' }))
        .map((category) => ({ id: category.id.toString(), name: category.name })),
    [categories],
  );

  useEffect(() => {
    const tab = TAB_DEFINITIONS.find((item) => item.key === activeTab);
    if (!tab?.showCategory) return;
    if (selectedCategoryId) return;
    if (categoryOptions.length === 0) return;
    setSelectedCategoryId(categoryOptions[0].id);
  }, [activeTab, categoryOptions, selectedCategoryId]);

  useEffect(() => {
    setEditingItem(null);
  }, [activeTab, selectedCategoryId]);

  const currentTab = TAB_DEFINITIONS.find((item) => item.key === activeTab) ?? TAB_DEFINITIONS[0];
  const FormComponent = currentTab.FormComponent;

  const handleSaved = () => {
    setRefreshToken((prev) => prev + 1);
    setEditingItem(null);
  };

  const handleEdit = (item: Record<string, any>) => {
    setEditingItem(item);
  };

  const handleCancelEdit = () => setEditingItem(null);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-white px-6 py-4 shadow-soft">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-ellieGray">콘텐츠 관리</h1>
          <p className="text-sm text-ellieGray/70">class_category 테이블 기준으로 콘텐츠를 생성하고 관리합니다.</p>
        </div>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-soft">
        <div className="mb-6 flex flex-wrap gap-2">
          {TAB_DEFINITIONS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key ? 'bg-[#ffd331] text-ellieGray' : 'bg-[#f5eee9] text-ellieGray/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <FormComponent
          key={`${currentTab.key}-${currentTab.showCategory ? selectedCategoryId : 'none'}`}
          onSaved={handleSaved}
          editingItem={editingItem}
          onCancelEdit={handleCancelEdit}
          categoryId={currentTab.showCategory ? selectedCategoryId : undefined}
          categoryOptions={currentTab.showCategory ? categoryOptions : undefined}
          onCategoryChange={currentTab.showCategory ? setSelectedCategoryId : undefined}
          isCategoryLoading={currentTab.showCategory ? isCategoryLoading : undefined}
          categoryError={currentTab.showCategory ? categoryError : undefined}
        />

        <div className="mt-8">
          <ContentList
            type={currentTab.apiType}
            categoryId={currentTab.showCategory ? selectedCategoryId : undefined}
            requiresCategory={currentTab.showCategory}
            refreshToken={refreshToken}
            onEdit={handleEdit}
            onDeleted={handleSaved}
          />
        </div>
      </section>
    </div>
  );
};

export default ContentTabs;
