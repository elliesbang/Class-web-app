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
import {
  createClass as requestCreateClass,
  deleteClass as requestDeleteClass,
  getClasses,
  updateClass as requestUpdateClass,
  type ClassFormPayload,
  type ClassInfo,
  type ClassMutationResult,
} from '../../../lib/api';

type AdminClassContextValue = {
  classes: ClassInfo[];
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  refresh: () => Promise<ClassInfo[]>;
  createClass: (payload: ClassFormPayload) => Promise<ClassMutationResult>;
  updateClass: (id: number, payload: ClassFormPayload) => Promise<ClassMutationResult>;
  deleteClass: (id: number) => Promise<ClassMutationResult>;
};

const AdminClassContext = createContext<AdminClassContextValue | undefined>(undefined);

const sortClasses = (input: ClassInfo[]) =>
  [...input].sort((a, b) => a.name.localeCompare(b.name, 'ko', { sensitivity: 'base' }));

export const AdminClassProvider = ({ children }: { children: ReactNode }) => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const loadClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetched = await getClasses();
      const sorted = sortClasses(fetched);
      setClasses(sorted);
      hasFetchedRef.current = true;
      return sorted;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '수업 정보를 불러오지 못했습니다.';
      setError(message);
      setClasses([]);
      hasFetchedRef.current = true;
      throw caught;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    return loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      loadClasses().catch((caught) => {
        console.error('[AdminClassProvider] failed to load classes', caught);
      });
    }
  }, [loadClasses]);

  const createClass = useCallback(async (payload: ClassFormPayload) => {
    const result = await requestCreateClass(payload);
    if (result.success && result.classInfo) {
      const record = result.classInfo;
      setClasses((prev) => sortClasses([...prev.filter((item) => item.id !== record.id), record]));
      hasFetchedRef.current = true;
    }
    return result;
  }, []);

  const updateClass = useCallback(async (id: number, payload: ClassFormPayload) => {
    const result = await requestUpdateClass(String(id), payload);
    if (result.success && result.classInfo) {
      const record = result.classInfo;
      setClasses((prev) => sortClasses([...prev.filter((item) => item.id !== record.id), record]));
      hasFetchedRef.current = true;
    }
    return result;
  }, []);

  const deleteClass = useCallback(async (id: number) => {
    const result = await requestDeleteClass(id);
    if (result.success) {
      setClasses((prev) => prev.filter((item) => item.id !== id));
      hasFetchedRef.current = true;
    }
    return result;
  }, []);

  const value = useMemo<AdminClassContextValue>(
    () => ({
      classes,
      isLoading,
      error,
      hasFetched: hasFetchedRef.current,
      refresh,
      createClass,
      updateClass,
      deleteClass,
    }),
    [classes, createClass, deleteClass, error, isLoading, refresh, updateClass],
  );

  return <AdminClassContext.Provider value={value}>{children}</AdminClassContext.Provider>;
};

export const useAdminClasses = () => {
  const context = useContext(AdminClassContext);
  if (!context) {
    throw new Error('useAdminClasses 훅은 AdminClassProvider 내에서만 사용할 수 있습니다.');
  }
  return context;
};
