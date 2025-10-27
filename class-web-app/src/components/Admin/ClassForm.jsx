import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../utils/apiClient';

const toCategoryString = (candidate) => {
  if (candidate == null) {
    return '';
  }

  if (typeof candidate === 'string' || typeof candidate === 'number') {
    return String(candidate).trim();
  }

  if (typeof candidate === 'object') {
    if ('name' in candidate && candidate.name != null) {
      return String(candidate.name).trim();
    }
    if ('value' in candidate && candidate.value != null) {
      return String(candidate.value).trim();
    }
    if ('label' in candidate && candidate.label != null) {
      return String(candidate.label).trim();
    }
    if ('id' in candidate && candidate.id != null) {
      return String(candidate.id).trim();
    }
  }

  return '';
};

const deriveCategoryValue = (categories) => {
  if (!categories || categories.length === 0) {
    return '';
  }

  return toCategoryString(categories[0]);
};

const initialFormData = {
  name: '',
  category: '',
  uploadOption: '',
};

const ClassForm = ({ categories = [], onSaved }) => {
  const defaultCategoryValue = useMemo(() => deriveCategoryValue(categories), [categories]);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    ...initialFormData,
    category: defaultCategoryValue,
  });

  useEffect(() => {
    if (!formData.category && defaultCategoryValue) {
      setFormData((prev) => ({ ...prev, category: defaultCategoryValue }));
    }
  }, [defaultCategoryValue, formData.category]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = typeof value === 'string' ? value : String(value ?? '');
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSave = async (event) => {
    event?.preventDefault?.();

    const safeName = typeof formData.name === 'string' ? formData.name.trim() : '';
    const safeCategory = typeof formData.category === 'string' ? formData.category.trim() : '';
    const safeUploadOption = typeof formData.uploadOption === 'string' ? formData.uploadOption.trim() : '';

    if (!safeName || !safeCategory) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      await apiFetch('/api/classes', {
        method: 'POST',
        body: JSON.stringify({
          name: safeName,
          category: safeCategory,
          uploadOption: safeUploadOption,
        }),
      });
      alert('수업이 성공적으로 저장되었습니다!');
      setIsSaving(false);
      setFormData({ name: '', category: '', uploadOption: '' });
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
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            카테고리를 선택하세요
          </option>
          {categories.map((category) => {
            const value = toCategoryString(category);
            if (!value) {
              return null;
            }

            const key =
              (category && typeof category === 'object' && 'id' in category && category.id != null
                ? String(category.id)
                : value) || value;

            return (
              <option key={key} value={value}>
                {value}
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
          disabled={
            isSaving ||
            typeof formData.name !== 'string' ||
            formData.name.trim().length === 0 ||
            typeof formData.category !== 'string' ||
            formData.category.trim().length === 0
          }
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
};

export default ClassForm;
