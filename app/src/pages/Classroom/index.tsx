import React, { useMemo, useState } from 'react';

import AccordionItem from '../../components/classroom/AccordionItem';
import CategoryButton from '../../components/classroom/CategoryButton';
import useCategories from '../../hooks/useCategories';

function ClassroomPage() {
  const { categories, loading, error } = useCategories();
  const [openParentId, setOpenParentId] = useState<number | null>(null);

  const groupedCategories = useMemo(() => {
    const parents = categories.filter((category) => category.parent_id === null);
    const children = categories.filter((category) => category.parent_id !== null);

    return parents.map((parent) => ({
      ...parent,
      children: children.filter((child) => child.parent_id === parent.id),
    }));
  }, [categories]);

  const toggleParent = (parentId: number) => {
    setOpenParentId((current) => (current === parentId ? null : parentId));
  };

  return (
    <div className="min-h-screen bg-[#fffdf6] text-ellieGray">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
        <header className="rounded-3xl bg-[#fef568] px-6 py-6 shadow-soft">
          <h1 className="text-2xl font-bold text-ellieGray">강의실</h1>
          <p className="mt-3 text-sm leading-relaxed text-ellieGray/70">
            상위 카테고리를 눌러 하위 강의실을 확인해보세요.
          </p>
        </header>

        <section className="space-y-4 rounded-3xl bg-white px-6 py-6 shadow-soft">
          {loading ? (
            <p className="text-sm text-ellieGray/70">카테고리를 불러오는 중입니다...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : groupedCategories.length === 0 ? (
            <p className="text-sm text-ellieGray/70">표시할 카테고리가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {groupedCategories.map((parent) => {
                const isOpen = openParentId === parent.id;

                return (
                  <AccordionItem
                    key={parent.id}
                    title={parent.name}
                    isOpen={isOpen}
                    onToggle={() => toggleParent(parent.id)}
                  >
                    <div className="grid gap-3 pt-1">
                      {parent.children.length === 0 ? (
                        <p className="rounded-2xl bg-[#fff8ec] px-4 py-3 text-sm text-ellieGray/70 shadow-soft">
                          하위 카테고리가 없습니다.
                        </p>
                      ) : (
                        parent.children.map((child) => <CategoryButton key={child.id} category={child} />)
                      )}
                    </div>
                  </AccordionItem>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ClassroomPage;
