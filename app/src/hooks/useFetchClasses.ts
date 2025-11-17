import { useEffect, useState } from 'react';
import { getClasses } from '../lib/api';

export function useFetchClasses() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) {
        return;
      }

      try {
        setLoading(true);
        const records = await getClasses();
        if (!isMounted) {
          return;
        }
        setClasses(records);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        console.error('[useFetchClasses] Failed to load classes', error);
        setClasses([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { classes, loading };
}
