import { useEffect, useState } from 'react';
import { fetchCategories } from '../lib/api/category';
import { useAuthUser } from './useAuthUser';  // 🔥 추가

export type Category = { id: number; name: string; parent_id: number | null };

type UseCategoriesResult = {
  categories: Category[];
  loading: boolean;
  error: string;
};

export function useCategories(): UseCategoriesResult {
  const authUser = useAuthUser();   // 🔥 로그인 사용자 가져오기

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authUser) return;          // 🔥 로그인 전에는 실행 금지
    if (!authUser.token) return;    // 🔥 토큰 없으면 실행 금지

    let isMounted = true;
    const controller = new AbortController();

    const loadCategories = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await fetchCategories();  // supabase session 이미 세팅됨
        if (!isMounted) return;

        setCategories(data);
      } catch (caught) {
        if (!isMounted || controller.signal.aborted) return;

        const message =
          caught instanceof Error
            ? caught.message
            : '카테고리를 불러오지 못했습니다.';
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
  }, [authUser]);   // 🔥 authUser가 준비된 이후에 실행됨

  return { categories, loading, error };
}

export default useCategories;
