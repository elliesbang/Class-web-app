import { useEffect, useState } from 'react';

import ContentList from '@/components/admin/content/ContentList';
import GlobalNoticeForm from '@/components/admin/content/GlobalNoticeForm';

const GlobalNoticesPage = () => {
  const [refreshToken, setRefreshToken] = useState(0);
  const [editingItem, setEditingItem] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    setEditingItem(null);
  }, []);

  const handleSaved = () => {
    setRefreshToken((prev) => prev + 1);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-white px-6 py-4 shadow-soft">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-ellieGray">전체 공지 관리</h1>
          <p className="text-sm text-ellieGray/70">전체 공지 생성, 수정, 삭제 기능을 분리된 화면에서 관리합니다.</p>
        </div>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-soft">
        <GlobalNoticeForm onSaved={handleSaved} editingItem={editingItem} onCancelEdit={() => setEditingItem(null)} />

        <div className="mt-8">
          <ContentList
            type="global"
            requiresCategory={false}
            refreshToken={refreshToken}
            onEdit={setEditingItem}
            onDeleted={handleSaved}
          />
        </div>
      </section>
    </div>
  );
};

export default GlobalNoticesPage;
