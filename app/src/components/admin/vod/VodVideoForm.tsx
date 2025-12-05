import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

type VodCategoryOption = {
  id: string;
  name: string;
};

type VodVideoFormProps = {
  categoryId: string;
  categoryOptions: VodCategoryOption[];
  onCategoryChange: (categoryId: string) => void;
  onSaved: () => void | Promise<void>;
  editingItem: Record<string, any> | null;
  onCancelEdit: () => void;
};

const toInt = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = Number.parseInt(String(value), 10);
  return Number.isNaN(numberValue) ? null : numberValue;
};

const VodVideoForm = ({
  categoryId,
  categoryOptions,
  onCategoryChange,
  onSaved,
  editingItem,
  onCancelEdit,
}: VodVideoFormProps) => {
  const initialCategoryId = useMemo(
    () => categoryId || categoryOptions[0]?.id?.toString?.() || '',
    [categoryId, categoryOptions],
  );

  const [formState, setFormState] = useState({
    title: '',
    description: '',
    videoUrl: '',
    displayOrder: '0',
    categoryId: initialCategoryId,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!editingItem) {
      setFormState((prev) => ({
        ...prev,
        title: '',
        description: '',
        videoUrl: '',
        displayOrder: '0',
        categoryId: initialCategoryId,
      }));
      return;
    }

    setFormState({
      title: editingItem.title ?? '',
      description: editingItem.description ?? '',
      videoUrl: editingItem.url ?? editingItem.videoUrl ?? '',
      displayOrder: String(editingItem.order_num ?? editingItem.displayOrder ?? '0'),
      categoryId:
        editingItem.category_id?.toString?.() || editingItem.categoryId?.toString?.() || initialCategoryId,
    });
  }, [editingItem, initialCategoryId]);

  useEffect(() => {
    setFormState((prev) => ({ ...prev, categoryId: initialCategoryId }));
  }, [initialCategoryId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      const isUpdate = Boolean(editingItem?.id);
      const endpoint = isUpdate
        ? `/api/admin-content-vod-update/${editingItem?.id}`
        : '/api/admin-content-vod-create';
      const method = isUpdate ? 'PUT' : 'POST';

      const payload = {
        title: formState.title,
        description: formState.description,
        url: formState.videoUrl,
        category_id: toInt(formState.categoryId),
        order_num: toInt(formState.displayOrder) ?? 0,
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('failed to save vod video');
      }

      await Promise.resolve(onSaved());
      setFormState({
        title: '',
        description: '',
        videoUrl: '',
        displayOrder: '0',
        categoryId: initialCategoryId,
      });
      onCancelEdit();
    } catch (error) {
      console.error('[content] vod video save error', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-ellieGray">카테고리</label>
        <select
          value={formState.categoryId}
          onChange={(event) => {
            const nextId = event.target.value;
            setFormState((prev) => ({ ...prev, categoryId: nextId }));
            onCategoryChange(nextId);
          }}
          className="rounded-2xl border border-ellieGray/20 px-4 py-2 text-sm focus:border-ellieOrange focus:outline-none"
        >
          {categoryOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-ellieGray">제목</label>
        <input
          type="text"
          value={formState.title}
          onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
          className="rounded-2xl border border-ellieGray/20 px-4 py-2 text-sm focus:border-ellieOrange focus:outline-none"
          placeholder="제목을 입력하세요"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-ellieGray">설명</label>
        <textarea
          value={formState.description}
          onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
          className="h-24 rounded-2xl border border-ellieGray/20 px-4 py-2 text-sm focus:border-ellieOrange focus:outline-none"
          placeholder="설명을 입력하세요"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-ellieGray">영상 URL</label>
        <input
          type="url"
          value={formState.videoUrl}
          onChange={(event) => setFormState((prev) => ({ ...prev, videoUrl: event.target.value }))}
          className="rounded-2xl border border-ellieGray/20 px-4 py-2 text-sm focus:border-ellieOrange focus:outline-none"
          placeholder="https://example.com"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-ellieGray">노출 순서</label>
        <input
          type="number"
          value={formState.displayOrder}
          onChange={(event) => setFormState((prev) => ({ ...prev, displayOrder: event.target.value }))}
          className="rounded-2xl border border-ellieGray/20 px-4 py-2 text-sm focus:border-ellieOrange focus:outline-none"
          min="0"
        />
      </div>

      <div className="flex gap-3">
        {editingItem ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-full border border-ellieGray/30 px-6 py-2 text-sm font-semibold text-ellieGray"
          >
            취소
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-ellieYellow px-8 py-2 text-sm font-semibold text-ellieGray disabled:opacity-50"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
};

export default VodVideoForm;
