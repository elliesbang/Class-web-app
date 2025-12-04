import { useEffect, useState } from 'react';

export type Category = {
  id: number;
  name: string;
  parent_id: number | null;
  depth: number | null;
  order_num: number | null;
};

type UseCategoriesResult = {
  categories: Category[];
  loading: boolean;
  error: string | null;
};

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      if (!token) {
        setCategories([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/categories', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('카테고리 로딩 실패');
        }

        const json = await res.json();
        setCategories(json.categories ?? []);
      } catch (err) {
        console.error('카테고리 불러오기 오류:', err);
        setError('카테고리를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { categories, loading, error };
}

export default useCategories;