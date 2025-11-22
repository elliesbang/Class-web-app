import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

import ContentTabs from '@/components/admin/content/ContentTabs';

const ContentManager = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    supabase.auth
      .getSession()
      .catch((error) => {
        console.error('[ContentManager] failed to confirm session', error);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) {
    return (
      <div className="rounded-3xl bg-white p-6 text-sm text-ellieGray/70 shadow-soft">
        콘텐츠 관리 화면을 불러오는 중입니다...
      </div>
    );
  }

  return <ContentTabs />;
};

export default ContentManager;
