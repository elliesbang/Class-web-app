import { useEffect, useState } from 'react';

type VodContentListProps = {
  refreshToken: number;
  onEdit: (item: Record<string, any>) => void;
  onDeleted: () => void;
};

const toInt = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = Number.parseInt(String(value), 10);
  return Number.isNaN(numberValue) ? null : numberValue;
};

const VodContentList = ({ refreshToken, onEdit, onDeleted }: VodContentListProps) => {
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchList = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/admin-content-vod-list');
        if (!response.ok) {
          throw new Error('콘텐츠 목록을 불러올 수 없습니다.');
        }
        const data = await response.json();
        if (!isMounted) return;
        const payloadItems = Array.isArray(data)
          ? data
          : Array.isArray((data as Record<string, any>)?.data)
            ? (data as Record<string, any>).data
            : [];
        setItems(payloadItems);
      } catch (caught) {
        if (!isMounted) return;
        console.error('[vod-content] list load failed', caught);
        setError('콘텐츠 목록을 불러오지 못했습니다.');
        setItems([]);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    void fetchList();

    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  const handleDelete = async (itemId: number | string) => {
    const numericId = toInt(itemId);
    if (numericId === null) {
      alert('삭제할 수 없습니다. 잘못된 ID입니다.');
      return;
    }

    if (!window.confirm('삭제하시겠습니까?')) return;

    setDeletingId(numericId);
    try {
      const response = await fetch(`/api/admin-content-vod-delete/${numericId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('삭제 실패');
      }
      onDeleted();
    } catch (caught) {
      console.error('[vod-content] delete failed', caught);
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-ellieGray/10 p-4">
      {isLoading ? (
        <p className="text-sm text-ellieGray/70">목록을 불러오는 중입니다...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ellieGray/70">데이터 없음</p>
      ) : (
        <ul className="divide-y divide-ellieGray/10">
          {items.map((item) => {
            const itemId = item.id ?? item.content_id;
            const normalizedItemId = typeof itemId === 'number' ? itemId : toInt(itemId);
            const isDeleting = normalizedItemId !== null && deletingId === normalizedItemId;
            return (
              <li key={itemId} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-ellieGray">{item.title ?? '제목 없음'}</p>
                  <p className="text-sm text-ellieGray/70">{item.url ?? item.videoUrl ?? ''}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="rounded-full border border-ellieGray/30 px-4 py-1 text-sm font-semibold text-ellieGray transition hover:border-ellieGray/60"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(itemId)}
                    disabled={isDeleting}
                    className="rounded-full bg-red-500 px-4 py-1 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default VodContentList;
