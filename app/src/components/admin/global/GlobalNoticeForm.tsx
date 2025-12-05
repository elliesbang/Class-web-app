import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

type GlobalNoticeFormProps = {
  onSaved: () => void | Promise<void>;
  editingItem: Record<string, any> | null;
  onCancelEdit: () => void;
};

const initialState = {
  title: '',
  content: '',
  isVisible: true,
};

const GlobalNoticeForm = ({ onSaved, editingItem, onCancelEdit }: GlobalNoticeFormProps) => {
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
      isVisible: Boolean(editingItem.is_visible ?? editingItem.isVisible ?? true),
    });
  }, [editingItem]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      const isUpdate = Boolean(editingItem?.id);
      const endpoint = isUpdate
        ? `/api/admin-content-global-update/${editingItem?.id}`
        : '/api/admin-content-global-create';
      const method = isUpdate ? 'PUT' : 'POST';

      const payload = {
        title: formState.title,
        content: formState.content,
        is_visible: formState.isVisible,
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('failed to save global notice');
      }

      await Promise.resolve(onSaved());
      setFormState(initialState);
      onCancelEdit();
    } catch (error) {
      console.error('[content] global notice save error', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="내용을 입력하세요"
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-ellieGray">
        <input
          type="checkbox"
          checked={formState.isVisible}
          onChange={(event) => setFormState((prev) => ({ ...prev, isVisible: event.target.checked }))}
          className="h-4 w-4"
        />
        노출 여부
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

export default GlobalNoticeForm;
