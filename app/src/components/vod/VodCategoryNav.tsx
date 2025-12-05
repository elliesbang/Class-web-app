import type { FC } from 'react';

type VodCategoryNavProps = {
  categories: { id: string; name: string }[];
  selectedCategoryId: string;
  onChange: (categoryId: string) => void;
};

const VodCategoryNav: FC<VodCategoryNavProps> = ({ categories, selectedCategoryId, onChange }) => {
  if (!categories.length) {
    return <p className="text-sm text-ellieGray/70">표시할 카테고리가 없습니다.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isActive = String(selectedCategoryId) === String(category.id);
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onChange(category.id)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${isActive ? 'border-ellieOrange bg-ellieYellow text-ellieGray shadow-sm' : 'border-ellieGray/20 bg-white text-ellieGray hover:border-ellieGray/50'}`}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
};

export default VodCategoryNav;
