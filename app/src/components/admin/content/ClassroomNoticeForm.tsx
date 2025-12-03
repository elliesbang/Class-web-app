import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import type { BaseFormProps, CategoryOption } from './ContentTabs';

const toInt = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = Number.parseInt(String(value), 10);
  return Number.isNaN(numberValue) ? null : numberValue;
};

type ClassroomNoticeFormProps = BaseFormProps & {
  categoryId?: string;
  categoryOptions?: CategoryOption[];
  onCategoryChange?: (value: string) => void;
  isCategoryLoading?: boolean;
  categoryError?: string | null;
};

const initialState = {
  title: '',
  content: '',
  isImportant: false,
};

const ClassroomNoticeForm = ({
  onSaved,
  editingItem,
  onCancelEdit,
  categoryId,
  categoryOptions,
  onCategoryChange,
  isCategoryLoading,
  categoryError,
}: ClassroomNoticeFormProps) => {
  const [formState, setFormState] = useState(initialState);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!editingItem) {
      setFormState(initialState);
      return;
    }

    setFormState({
      title: editingItem.title ?? '',
      content: editingItem.content ?? '',
      isImportant: Boolean(editingItem.is_important ?? editingItem.isImportant ?? false),
    });
  }, [editingItem]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSaving) return;
    if (!categoryId) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const isUpdate = Boolean(editingItem?.id);
      const endpoint = isUpdate
        ? `/api/admin-content-classroom-notice-update/${editingItem?.id}`
        : '/api/admin-content-classroom-notice-create';
      const method = isUpdate ? 'PUT' : 'POST';

      const payload = {
        title: formState.title,
        content: formState.content,
        is_important: formState.isImportant,
        category_id: toInt(categoryId),
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('failed to save classroom notice');
      }

      await Promise.resolve(onSaved());
      setFormState(initialState);
      onCancelEdit();
    } catch (error) {
      console.error('[content] classroom notice save error', error);
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
        <label className="text-sm font-semibold text-ellieGray">내용</label>
        <textarea
          value={formState.content}
          onChange={(event) => setFormState((prev) => ({ ...prev, content: event.target.value }))}
          className="h-32 rounded-2xl border border-ellieGray/20 px-4 py-2 text-sm focus:border-ellieOrange focus:outline-none"
          placeholder="공지 내용을 입력하세요"
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-ellieGray">
        <input
          type="checkbox"
          checked={formState.isImportant}
          onChange={(event) => setFormState((prev) => ({ ...prev, isImportant: event.target.checked }))}
          className="h-4 w-4"
        />
        중요 공지로 표시
      </label>

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

export default ClassroomNoticeForm;
