import React from 'react';

import type { Category } from '../../hooks/useCategories';

type CategoryButtonProps = {
  category: Category;
  onClick?: (category: Category) => void;
};

function CategoryButton({ category, onClick }: CategoryButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(category)}
      className="w-full rounded-2xl border border-[#f1e6c7] bg-[#fffaf2] px-4 py-3 text-left text-sm font-medium text-ellieGray shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#ffd331]/50"
    >
      {category.name}
    </button>
  );
}

export default CategoryButton;
