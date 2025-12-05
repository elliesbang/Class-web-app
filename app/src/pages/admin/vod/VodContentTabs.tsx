import { useState } from 'react';

import VodContentList from '@/components/admin/vod/VodContentList';
import VodVideoForm from '@/components/admin/vod/VodVideoForm';

const VodContentTabs = () => {
  const [refreshToken, setRefreshToken] = useState(0);
  const [editingItem, setEditingItem] = useState<Record<string, any> | null>(null);

  const handleSaved = () => {
    setRefreshToken((prev) => prev + 1);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-white px-6 py-4 shadow-soft">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-ellieGray">VOD 콘텐츠 관리</h1>
          <p className="text-sm text-ellieGray/70">VOD 영상을 등록하고 관리합니다.</p>
        </div>
      </header>

      <section className="rounded-3xl bg-white p-6 shadow-soft">
        <VodVideoForm onSaved={handleSaved} editingItem={editingItem} onCancelEdit={() => setEditingItem(null)} />

        <div className="mt-8">
          <VodContentList refreshToken={refreshToken} onEdit={setEditingItem} onDeleted={handleSaved} />
        </div>
      </section>
    </div>
  );
};

export default VodContentTabs;
