import type { FC } from 'react';

type VodCategorySelectorProps = {
  categories: Array<{ id: number; name: string }>;
  selected: number | null;
  onChange: (value: number | null) => void;
};

const VodCategorySelector: FC<VodCategorySelectorProps> = ({
  categories,
  selected,
  onChange,
}) => (
  <div className="flex flex-col gap-2 text-sm text-[#7a6f68] md:flex-row md:items-center md:gap-3">
    <label className="font-semibold text-[#5c5c5c]">VOD 카테고리</label>
    <select
      className="rounded-2xl border border-[#e9dccf] px-4 py-2"
      value={selected ?? ''}
      onChange={(event) =>
        onChange(event.target.value === '' ? null : Number(event.target.value))
      }
    >
      <option value="">카테고리를 선택하세요</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  </div>
);

export default VodCategorySelector;
