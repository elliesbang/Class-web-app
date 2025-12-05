import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import type { ClassroomFormProps } from './types';

const toInt = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = Number.parseInt(String(value), 10);
  return Number.isNaN(numberValue) ? null : numberValue;
};

const initialState = {
  title: '',
  videoUrl: '',
  description: '',
  displayOrder: '0',
};

const ClassroomVideoForm = ({
  classId,
  onSaved,
  editingItem,
  onCancelEdit,
  categoryId,
  categoryOptions,
  onCategoryChange,
  isCategoryLoading,
  categoryError,
}: ClassroomFormProps) => {
  const [formState, setFormState] = useState(initialState);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!editingItem) {
      setFormState(initialState);
      return;
    }

    setFormState({
      title: editingItem.title ?? '',
      videoUrl: editingItem.url ?? editingItem.videoUrl ?? '',
      description: editingItem.description ?? '',
      displayOrder: String(editingItem.order_num ?? editingItem.displayOrder ?? '0'),
    });
  }, [editingItem]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSaving) return;
    if (!categoryId) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    if (!classId) {
      alert('유효한 class_id가 필요합니다.');
      return;
    }

    setIsSaving(true);
    try {
      const isUpdate = Boolean(editingItem?.id);
      const endpoint = isUpdate
        ? `/api/admin-content-classroom-video-update/${editingItem?.id}`
        : '/api/admin-content-classroom-video-create';
      const method = isUpdate ? 'PUT' : 'POST';

      const payload = {
        class_id: classId,
        title: formState.title,
        description: formState.description,
        url: formState.videoUrl,
        category_id: toInt(categoryId),
        order_num: toInt(formState.displayOrder) ?? 0,
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('failed to save classroom video');
      }

      await Promise.resolve(onSaved());
      setFormState(initialState);
      onCancelEdit();
    } catch (error) {
      console.error('[content] classroom video save error', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderCategorySelect = () => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-ellieGray">카테고리</label>
      <select
        value={categoryId ?? ''}
        onChange={(event) => onCategoryChange?.(event.target.value)}
        disabled={isCategoryLoading || (categoryOptions?.length ?? 0) === 0}
        className="rounded-2xl border border-ellieGray/20 px-4 py-2 text-sm focus:border-ellieOrange focus:outline-none"
        required
      >
        {isCategoryLoading ? (
          <option value="">불러오는 중...</option>
        ) : categoryError ? (
          <option value="">카테고리를 불러오지 못했습니다.</option>
        ) : (categoryOptions?.length ?? 0) === 0 ? (
          <option value="">카테고리가 없습니다.</option>
        ) : (
          categoryOptions?.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))
        )}
      </select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {renderCategorySelect()}
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
        <label className="text-sm font-semibold text-ellieGray">설명</label>
        <textarea
          value={formState.description}
          onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
          className="h-24 rounded-2xl border border-ellieGray/20 px-4 py-2 text-sm focus:border-ellieOrange focus:outline-none"
          placeholder="영상 설명을 입력하세요"
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

export default ClassroomVideoForm;
