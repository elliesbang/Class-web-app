import { useEffect, useMemo, useState } from 'react';

type ContentRecord = {
  id: number;
  category_id: number | null;
  title: string;
  content: string;
  url: string | null;
  created_at: string;
};

export type TabConfig = {
  key: string;
  label: string;
  type: 'notice' | 'video' | 'material' | 'global' | 'vod';
  requiresCategory: boolean;
  categorySource?: 'class' | 'vod';
};

type ContentEditorProps = {
  tab: TabConfig;
  categories: { id: string; name: string }[];
  selectedCategoryId?: string;
  onCategoryChange?: (value: string) => void;
  isLoadingCategories?: boolean;
  categoryError?: string | null;
};

const initialFormState = {
  id: undefined as number | undefined,
  title: '',
  content: '',
  url: '',
};

const ContentEditor = ({
  tab,
  categories,
  selectedCategoryId,
  onCategoryChange,
  isLoadingCategories = false,
  categoryError,
}: ContentEditorProps) => {
  const [form, setForm] = useState(initialFormState);
  const [items, setItems] = useState<ContentRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiresCategory = tab.requiresCategory;

  const canSubmit = useMemo(() => {
    if (requiresCategory && !selectedCategoryId) return false;
    return form.title.trim().length > 0 && form.content.trim().length > 0;
  }, [requiresCategory, selectedCategoryId, form.title, form.content]);

  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams({ type: tab.type });
      if (requiresCategory && selectedCategoryId) {
        searchParams.append('category_id', selectedCategoryId);
      }

      const response = await fetch(`/.netlify/functions/classroom-content-get?${searchParams.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || '콘텐츠를 불러오지 못했습니다.');

      setItems(Array.isArray(data) ? data : []);
    } catch (caught) {
      console.error('[content-editor] failed to fetch items', caught);
      setError(caught instanceof Error ? caught.message : '콘텐츠를 불러오지 못했습니다.');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setForm(initialFormState);
    void fetchItems();
  }, [tab.type, selectedCategoryId]);

  const handleSave = async () => {
    if (!canSubmit) return;

    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        id: form.id,
        type: tab.type,
        category_id: requiresCategory ? Number(selectedCategoryId) : null,
        title: form.title.trim(),
        content: form.content.trim(),
        url: form.url.trim() || null,
      };

      const response = await fetch('/.netlify/functions/classroom-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || '저장에 실패했습니다.');

      setForm(initialFormState);
      await fetchItems();
    } catch (caught) {
      console.error('[content-editor] failed to save', caught);
      setError(caught instanceof Error ? caught.message : '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    try {
      const response = await fetch(`/.netlify/functions/classroom-content?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || '삭제에 실패했습니다.');
      await fetchItems();
    } catch (caught) {
      console.error('[content-editor] failed to delete', caught);
      setError(caught instanceof Error ? caught.message : '삭제에 실패했습니다.');
    }
  };

  const handleEdit = (item: ContentRecord) => {
    setForm({
      id: item.id,
      title: item.title,
      content: item.content,
      url: item.url ?? '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-ellieGray/10 bg-ellieGray/5 p-4">
          <h2 className="text-lg font-semibold text-ellieGray">{tab.label} 작성</h2>

          {requiresCategory ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-ellieGray/80">카테고리</label>
              <select
                value={selectedCategoryId ?? ''}
                onChange={(event) => onCategoryChange?.(event.target.value)}
                disabled={isLoadingCategories || categories.length === 0}
                className="rounded-lg border border-ellieGray/20 px-3 py-2 text-sm text-ellieGray focus:border-ellieOrange focus:outline-none"
              >
                {isLoadingCategories ? (
                  <option value="">카테고리 불러오는 중...</option>
                ) : categoryError ? (
                  <option value="">{categoryError}</option>
                ) : categories.length === 0 ? (
                  <option value="">카테고리가 없습니다.</option>
                ) : (
                  categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-ellieGray/80">제목</label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="rounded-lg border border-ellieGray/20 px-3 py-2 text-sm text-ellieGray focus:border-ellieOrange focus:outline-none"
              placeholder="제목을 입력하세요"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-ellieGray/80">내용</label>
            <textarea
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              className="h-32 rounded-lg border border-ellieGray/20 px-3 py-2 text-sm text-ellieGray focus:border-ellieOrange focus:outline-none"
              placeholder="내용을 입력하세요"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-ellieGray/80">URL</label>
            <input
              type="url"
              value={form.url}
              onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
              className="rounded-lg border border-ellieGray/20 px-3 py-2 text-sm text-ellieGray focus:border-ellieOrange focus:outline-none"
              placeholder="링크를 입력하세요"
            />
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSubmit || isSaving}
              className="rounded-lg bg-ellieOrange px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-ellieOrange/50"
            >
              {isSaving ? '저장 중...' : '저장하기'}
            </button>
            {form.id ? (
              <button
                type="button"
                onClick={() => setForm(initialFormState)}
                className="text-sm font-semibold text-ellieGray/70 underline"
              >
                새로 작성하기
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-ellieGray/10 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ellieGray">등록된 목록</h3>
            <button
              type="button"
              onClick={fetchItems}
              className="rounded-full bg-ellieGray/10 px-3 py-1 text-xs font-semibold text-ellieGray hover:bg-ellieGray/20"
            >
              새로고침
            </button>
          </div>
          {isLoading ? (
            <p className="text-sm text-ellieGray">불러오는 중...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-ellieGray/70">등록된 콘텐츠가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-ellieGray/10">
              {items.map((item) => (
                <li key={item.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ellieGray">{item.title}</p>
                    <p className="text-xs text-ellieGray/60">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="rounded-full bg-ellieGray/10 px-3 py-1 text-xs font-semibold text-ellieGray hover:bg-ellieGray/20"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-200"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentEditor;
