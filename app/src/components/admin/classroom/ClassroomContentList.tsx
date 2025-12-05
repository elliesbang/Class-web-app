import { useEffect, useMemo, useState } from 'react';

type ClassroomContentType = 'classroomVideo' | 'classroomNotice' | 'material';

type ClassroomContentListProps = {
  classId: string;
  type: ClassroomContentType;
  categoryId?: string;
  requiresCategory?: boolean;
  refreshToken: number;
  onEdit: (item: Record<string, any>) => void;
  onDeleted: () => void;
};

const toInt = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = Number.parseInt(String(value), 10);
  return Number.isNaN(numberValue) ? null : numberValue;
};

const ClassroomContentList = ({
  classId,
  type,
  categoryId,
  requiresCategory = true,
  refreshToken,
  onEdit,
  onDeleted,
}: ClassroomContentListProps) => {
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const endpointSuffix = useMemo(() => {
    if (type === 'classroomVideo') return 'classroomVideo';
    if (type === 'classroomNotice') return 'classroomNotice';
    return 'material';
  }, [type]);

  useEffect(() => {
    let isMounted = true;

    const fetchList = async () => {
      if (!classId) {
        setItems([]);
        setError('class_id가 필요합니다.');
        return;
      }

      if (requiresCategory && !categoryId) {
        setItems([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams({ class_id: classId });
        if (categoryId) {
          query.set('category_id', categoryId);
        }
        const response = await fetch(`/api/admin-content-${endpointSuffix}-list?${query.toString()}`);
        const data = (await response.json().catch(() => null)) as
          | { success?: boolean; items?: Record<string, any>[] }
          | null;

        if (!response.ok || !data?.success) {
          throw new Error('콘텐츠 목록을 불러올 수 없습니다.');
        }
        if (!isMounted) return;
        const payloadItems = Array.isArray(data.items) ? data.items : [];
        setItems(payloadItems);
      } catch (caught) {
        if (!isMounted) return;
        console.error(`[classroom-content] list load failed (${type})`, caught);
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
  }, [classId, type, categoryId, requiresCategory, refreshToken, endpointSuffix]);

  const handleDelete = async (itemId: number | string) => {
    const numericId = toInt(itemId);
    if (numericId === null) {
      alert('삭제할 수 없습니다. 잘못된 ID입니다.');
      return;
    }

    if (!window.confirm('삭제하시겠습니까?')) return;

    setDeletingId(numericId);
    try {
      const query = new URLSearchParams({ class_id: classId });
      const response = await fetch(`/api/admin-content-${endpointSuffix}-delete/${numericId}?${query.toString()}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('삭제 실패');
      }
      onDeleted();
    } catch (caught) {
      console.error('[classroom-content] delete failed', caught);
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setDeletingId(null);
    }
  };

  const renderSecondaryText = (item: Record<string, any>) => {
    if (type === 'classroomVideo') return item.url ?? item.videoUrl ?? '';
    if (type === 'material') return item.url ?? item.resourceUrl ?? '';
    if (type === 'classroomNotice') return item.content ?? '';
    return '';
  };

  const isCategoryMissing = requiresCategory && !categoryId;

  return (
    <div className="rounded-2xl border border-ellieGray/10 p-4">
      {!classId ? (
        <p className="text-sm text-red-500">class_id가 필요합니다.</p>
      ) : isCategoryMissing ? (
        <p className="text-sm text-ellieGray/70">카테고리를 먼저 선택해주세요.</p>
      ) : isLoading ? (
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
                  <p className="text-sm text-ellieGray/70">{renderSecondaryText(item) || '내용 없음'}</p>
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

export default ClassroomContentList;
