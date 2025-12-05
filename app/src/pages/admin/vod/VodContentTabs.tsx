import { useEffect, useState } from 'react';

import VodContentList from '@/components/admin/vod/VodContentList';
import VodVideoForm from '@/components/admin/vod/VodVideoForm';
import { fetchVodCategories } from '@/lib/api/vod-categories';

type VodCategoryOption = {
  id: string;
  name: string;
};

const VodContentTabs = () => {
  const [refreshToken, setRefreshToken] = useState(0);
  const [editingItem, setEditingItem] = useState<Record<string, any> | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<VodCategoryOption[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const categories = await fetchVodCategories();
        if (!isMounted) return;
        const options = (categories ?? []).map((category) => ({
          id: String(category.id),
          name: category.name,
        }));
        setCategoryOptions(options);
        setSelectedCategoryId((prev) => prev || (options?.[0]?.id ?? ''));
      } catch (error) {
        if (!isMounted) return;
        console.error('[vod-content] failed to load categories', error);
        setCategoryOptions([]);
        setSelectedCategoryId('');
      }
    };

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaved = () => {
    setRefreshToken((prev) => prev + 1);
    setEditingItem(null);
  };

  const handleCategoryChange = (nextCategoryId: string) => {
    setSelectedCategoryId(nextCategoryId);
    setEditingItem(null);
  };

  const effectiveCategoryId = selectedCategoryId || categoryOptions[0]?.id?.toString?.() || '';

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-white px-6 py-4 shadow-soft">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-ellieGray">VOD 콘텐츠 관리</h1>
          <p className="text-sm text-ellieGray/70">VOD 영상을 등록하고 관리합니다.</p>
        </div>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-soft">
        <VodVideoForm
          categoryId={effectiveCategoryId}
          categoryOptions={categoryOptions}
          onCategoryChange={handleCategoryChange}
          onSaved={handleSaved}
          editingItem={editingItem}
          onCancelEdit={() => setEditingItem(null)}
        />

        <div className="mt-8">
          <VodContentList
            categoryId={effectiveCategoryId}
            refreshToken={refreshToken}
            onEdit={setEditingItem}
            onDeleted={handleSaved}
          />
        </div>
      </section>
    </div>
  );
};

export default VodContentTabs;
