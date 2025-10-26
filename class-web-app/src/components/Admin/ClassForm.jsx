import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../utils/apiClient';

const deriveCategoryId = (categories) => {
  if (!categories || categories.length === 0) {
    return '';
  }

  const first = categories[0];
  if (typeof first === 'string' || typeof first === 'number') {
    return String(first);
  }

  if (typeof first === 'object' && first !== null) {
    if ('value' in first && first.value !== undefined) {
      return String(first.value);
    }
    if ('id' in first && first.id !== undefined) {
      return String(first.id);
    }
  }

  return '';
};

const initialFormData = {
  name: '',
  categoryId: '',
  uploadOption: '',
};

const ClassForm = ({ categories = [], onSaved }) => {
  const defaultCategoryId = useMemo(() => deriveCategoryId(categories), [categories]);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    ...initialFormData,
    categoryId: defaultCategoryId,
  });

  useEffect(() => {
    if (!formData.categoryId && defaultCategoryId) {
      setFormData((prev) => ({ ...prev, categoryId: defaultCategoryId }));
    }
  }, [defaultCategoryId, formData.categoryId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (event) => {
    event?.preventDefault?.();

    if (!formData.name || !formData.categoryId) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      await apiFetch('/api/classes', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      alert('수업이 성공적으로 저장되었습니다!');
      setIsSaving(false);
      setFormData({ name: '', categoryId: '', uploadOption: '' });
      if (typeof onSaved === 'function') {
        onSaved();
      }
    } catch (error) {
      console.error(error);
      alert('저장 중 오류가 발생했습니다.');
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700" htmlFor="class-name">
          수업명
        </label>
        <input
          id="class-name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="수업명을 입력하세요"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700" htmlFor="class-category">
          카테고리
        </label>
        <select
          id="class-category"
          name="categoryId"
          value={formData.categoryId}
          onChange={handleChange}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            카테고리를 선택하세요
          </option>
          {categories.map((category) => {
            if (typeof category === 'string' || typeof category === 'number') {
              const value = String(category);
              return (
                <option key={value} value={value}>
                  {value}
                </option>
              );
            }

            const key = category.id ?? category.value ?? category.name;
            const value = category.id ?? category.value ?? '';
            const label = category.name ?? category.label ?? value;

            return (
              <option key={String(key)} value={String(value)}>
                {String(label)}
              </option>
            );
          })}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700" htmlFor="class-upload-option">
          업로드 옵션
        </label>
        <input
          id="class-upload-option"
          name="uploadOption"
          type="text"
          value={formData.uploadOption}
          onChange={handleChange}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="업로드 옵션을 입력하세요"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving || !formData.name || !formData.categoryId}
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
};

export default ClassForm;
