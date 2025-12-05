import { useEffect, useState } from 'react';

import GlobalContentList from '@/components/admin/global/GlobalContentList';
import GlobalNoticeForm from '@/components/admin/global/GlobalNoticeForm';

const GlobalContentTabs = () => {
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
          <p className="text-sm text-ellieGray/70">전체 공지를 생성, 수정, 삭제합니다.</p>
        </div>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-soft">
        <GlobalNoticeForm onSaved={handleSaved} editingItem={editingItem} onCancelEdit={() => setEditingItem(null)} />

        <div className="mt-8">
          <GlobalContentList refreshToken={refreshToken} onEdit={setEditingItem} onDeleted={handleSaved} />
        </div>
      </section>
    </div>
  );
};

export default GlobalContentTabs;
