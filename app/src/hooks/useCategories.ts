import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type Category = {
  id: number;
  name: string;
  parent_id: number | null;
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
        .from('class_categories')              // ★ 올바른 테이블
        .select('*')
        .order('order_num', { ascending: true });   // ★ 순서 보장

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
  }, []); // ★ authUser 의존성 없음 → 즉시 로딩 시작

  return { categories, loading, error };
}

export default useCategories;
