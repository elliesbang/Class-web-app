import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import ClassroomContentList from '@/components/admin/classroom/ClassroomContentList';
import ClassroomNoticeForm from '@/components/admin/classroom/ClassroomNoticeForm';
import ClassroomVideoForm from '@/components/admin/classroom/ClassroomVideoForm';
import MaterialForm from '@/components/admin/classroom/MaterialForm';
import type { ClassroomFormProps, CategoryOption } from '@/components/admin/classroom/types';
import useAssignments from '@/hooks/useAssignments';
import { getCategories } from '@/lib/api/category';

type TabKey = 'classroomVideo' | 'classroomNotice' | 'material';

type TabDefinition = {
  key: TabKey;
  label: string;
  showCategory: boolean;
  FormComponent: ComponentType<ClassroomFormProps>;
};

const TAB_DEFINITIONS: TabDefinition[] = [
  { key: 'classroomVideo', label: '강의실 영상', showCategory: true, FormComponent: ClassroomVideoForm },
  { key: 'classroomNotice', label: '강의실 공지', showCategory: true, FormComponent: ClassroomNoticeForm },
  { key: 'material', label: '자료', showCategory: true, FormComponent: MaterialForm },
];

type CategoryRecord = { id: number; name: string; parent_id: number | null };

type ClassroomContentTabsProps = {
  initialTab?: TabKey;
};

const ClassroomContentTabs = ({ initialTab = 'classroomVideo' }: ClassroomContentTabsProps) => {
  const { class_id } = useParams();
  const classId = class_id ?? '';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [editingItem, setEditingItem] = useState<Record<string, any> | null>(null);

  useAssignments(classId);

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
        console.error('[classroom-content] failed to load categories', error);
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
  }, [activeTab, selectedCategoryId, classId]);

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

  const renderHeader = () => (
    <header className="rounded-3xl bg-white px-6 py-4 shadow-soft">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-ellieGray">강의실 관리 (Classrooms)</h1>
        <p className="text-sm text-ellieGray/70">강의실별 영상, 자료, 공지를 개별적으로 관리합니다.</p>
        {classId ? (
          <p className="text-sm font-semibold text-ellieGray">대상 강의실 ID: {classId}</p>
        ) : (
          <p className="text-sm text-red-500">강의실 ID가 필요합니다. URL에 /:class_id 를 포함해 이동해주세요.</p>
        )}
      </div>
    </header>
  );

  return (
    <div className="space-y-6">
      {renderHeader()}

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
          key={`${currentTab.key}-${currentTab.showCategory ? selectedCategoryId : 'none'}-${classId}`}
          classId={classId}
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
          <ClassroomContentList
            classId={classId}
            type={currentTab.key}
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

export default ClassroomContentTabs;
