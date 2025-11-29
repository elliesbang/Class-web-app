import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

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
      setLoading(true);

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order_num', { ascending: true });

      if (error) {
        console.error('카테고리 불러오기 오류:', error.message);
        setError('카테고리를 불러오지 못했습니다.');
        setCategories([]);
      } else {
        setCategories(data ?? []);
      }

      setLoading(false);
    }

    load();
  }, []);

  return { categories, loading, error };
}

export default useCategories;
