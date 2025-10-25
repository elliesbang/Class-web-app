import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getCategories, type Category } from '../../../lib/api';

type AdminCategoryContextValue = {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  refresh: () => Promise<Category[]>;
};

const AdminCategoryContext = createContext<AdminCategoryContextValue | undefined>(undefined);

export const AdminCategoryProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetched = await getCategories();
      setCategories(fetched);
      hasFetchedRef.current = true;
      return fetched;
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : '카테고리 정보를 불러오지 못했습니다.';
      setError(message);
      setCategories([]);
      hasFetchedRef.current = true;
      throw caught;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      refresh().catch((caught) => {
        console.error('[AdminCategoryProvider] failed to load categories', caught);
      });
    }
  }, [refresh]);

  const value = useMemo<AdminCategoryContextValue>(
    () => ({
      categories,
      isLoading,
      error,
      hasFetched: hasFetchedRef.current,
      refresh,
    }),
    [categories, error, isLoading, refresh],
  );

  return <AdminCategoryContext.Provider value={value}>{children}</AdminCategoryContext.Provider>;
};

export const useAdminCategories = () => {
  const context = useContext(AdminCategoryContext);
  if (!context) {
    throw new Error('useAdminCategories 훅은 AdminCategoryProvider 내에서만 사용할 수 있습니다.');
  }
  return context;
};
