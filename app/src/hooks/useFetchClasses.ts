import { useEffect, useState } from 'react';

type FetchClassesResponse = {
  data?: unknown;
  results?: unknown;
  classes?: unknown;
};

const extractClassList = (payload: unknown): any[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const data = payload as FetchClassesResponse;
    if (Array.isArray(data.data)) {
      return data.data;
    }

    if (Array.isArray(data.results)) {
      return data.results;
    }

    if (Array.isArray(data.classes)) {
      return data.classes;
    }
  }

  return [];
};

export function useFetchClasses() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) {
        return;
      }

      setClasses([]);
      setLoading(false);

      // try {
      //   const res = await apiFetch('/api/classes');
      //   if (!isMounted) {
      //     return;
      //   }
      //   setClasses(extractClassList(res));
      // } catch (error) {
      //   if (!isMounted) {
      //     return;
      //   }
      //   console.error('[useFetchClasses] Failed to load classes', error);
      // } finally {
      //   if (isMounted) {
      //     setLoading(false);
      //   }
      // }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { classes, loading };
}
