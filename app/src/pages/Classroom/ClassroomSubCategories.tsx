import React from 'react';
import { useNavigate } from 'react-router-dom';

import CategoryButton from '../../components/classroom/CategoryButton';
import type { Category } from '../../hooks/useCategories';

type ClassroomSubCategoriesProps = {
  subCategories: Category[];
};

function ClassroomSubCategories({ subCategories }: ClassroomSubCategoriesProps) {
  const navigate = useNavigate();

  const handleSelect = (subCategory: Category) => {
    const destination = `/classroom/${subCategory.id}`;
    navigate(destination);
  };

  return (
    <div className="grid gap-3 pt-1 pointer-events-auto">
      {subCategories.map((subCategory) => (
        <CategoryButton key={subCategory.id} category={subCategory} onClick={() => handleSelect(subCategory)} />
      ))}
    </div>
  );
}

export default ClassroomSubCategories;
