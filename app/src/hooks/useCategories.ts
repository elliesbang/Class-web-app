import { useEffect, useState } from 'react';

import { fetchCategories } from '../lib/api/category';

export type Category = { id: number; name: string; parent_id: number | null };

type UseCategoriesResult = {
  categories: Category[];
  loading: boolean;
  error: string;
};

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadCategories = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await fetchCategories({ signal: controller.signal });
        if (!isMounted) return;

        setCategories(data);
      } catch (caught) {
        if (!isMounted || controller.signal.aborted) return;

        const message = caught instanceof Error ? caught.message : '카테고리를 불러오지 못했습니다.';
        setError(message);
        setCategories([]);
      } finally {
        if (!isMounted || controller.signal.aborted) return;

        setLoading(false);
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return { categories, loading, error };
}

export default useCategories;
