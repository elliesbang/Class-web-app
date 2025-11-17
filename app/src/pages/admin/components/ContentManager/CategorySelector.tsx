import type { FC } from 'react';

type CategorySelectorProps = {
  categories: Array<{ id: string; name: string }>;
  selected: string;
  onChange: (value: string) => void;
};

const ClassCategorySelector: FC<CategorySelectorProps> = ({
  categories,
  selected,
  onChange,
}) => (
  <div className="flex flex-col gap-2 text-sm text-[#7a6f68] md:flex-row md:items-center md:gap-3">
    <label className="font-semibold text-[#5c5c5c]">강의 카테고리</label>
    <select
      className="rounded-2xl border border-[#e9dccf] px-4 py-2"
      value={selected}
      onChange={(event) => onChange(event.target.value)}
    >
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  </div>
);

export default ClassCategorySelector;
