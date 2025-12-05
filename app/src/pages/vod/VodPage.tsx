import { useEffect, useState } from 'react';

import VodCategoryNav from '@/components/vod/VodCategoryNav';
import VodVideoList from '@/components/vod/VodVideoList';
import { fetchVodCategories } from '@/lib/api/vod-categories';

type VodCategory = {
  id: string;
  name: string;
};

const VodPage = () => {
  const [categories, setCategories] = useState<VodCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchVodCategories();
        if (!isMounted) return;
        setCategories(data as VodCategory[]);
        setSelectedCategoryId((prev) => prev || (data?.[0]?.id?.toString?.() ?? ''));
      } catch (caught) {
        if (!isMounted) return;
        console.error('[vod] failed to load categories', caught);
        setError('카테고리를 불러오지 못했습니다.');
        setCategories([]);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-ellieGray">VOD</h1>
        <p className="text-sm text-ellieGray/70">카테고리를 선택해 원하는 VOD 영상을 확인하세요.</p>
      </header>

      {isLoading ? (
        <p className="text-sm text-ellieGray/70">카테고리를 불러오는 중입니다...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <VodCategoryNav
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onChange={handleCategoryChange}
        />
      )}

      <VodVideoList selectedCategoryId={selectedCategoryId} />
    </div>
  );
};

export default VodPage;
