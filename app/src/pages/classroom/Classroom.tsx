import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ClassroomListItem from '../../components/ClassroomListItem';
import { classes } from '../../data/classData';

type CategoryId = 'skill' | 'money' | 'ai';

type CategoryConfig = {
  id: CategoryId;
  name: string;
};

const CATEGORY_CONFIGS: CategoryConfig[] = [
  { id: 'skill', name: '스킬' },
  { id: 'money', name: '수익화' },
  { id: 'ai', name: 'AI 창작' },
];

function Classroom() {
  const navigate = useNavigate();
  const [openCategory, setOpenCategory] = useState<CategoryId | null>(null);

  const categorizedCategories = useMemo(() => {
    const filterByCategory = (categoryId: CategoryId) =>
      classes.filter((course) => course.category === categoryId && course.hidden !== true);

    return CATEGORY_CONFIGS.map((category) => ({
      ...category,
      courses: filterByCategory(category.id),
    }));
  }, []);

  const handleToggle = (categoryId: CategoryId) => {
    setOpenCategory((current) => (current === categoryId ? null : categoryId));
  };

  const handleEnterClass = (courseId: string) => {
    if (!courseId) {
      return;
    }
    navigate(`/class/${courseId}`);
  };

  return (
    <div className="min-h-screen bg-[#fffdf6] text-ellieGray">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
        <header className="rounded-3xl bg-[#fef568] px-6 py-6 shadow-soft">
          <h1 className="text-2xl font-bold text-ellieGray">강의실</h1>
          <p className="mt-3 text-sm leading-relaxed text-ellieGray/70">
            새로운 스킬과 수익화를 위한 강의를 확인하고 수강을 시작해보세요.
          </p>
        </header>

        <section className="space-y-4">
          {categorizedCategories.map((category) => {
            const isOpen = openCategory === category.id;

            return (
              <article key={category.id} className="rounded-3xl bg-transparent">
                <button
                  type="button"
                  onClick={() => handleToggle(category.id)}
                  className="flex w-full items-center justify-between rounded-3xl bg-white px-6 py-5 text-left shadow-soft transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
                  aria-expanded={isOpen}
                  aria-controls={`${category.id}-panel`}
                >
                  <span className="text-lg font-semibold">{category.name}</span>
                  <span className="text-xl font-semibold">{isOpen ? '−' : '+'}</span>
                </button>

                <div
                  id={`${category.id}-panel`}
                  className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] pt-4' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="space-y-3 overflow-hidden">
                    {category.courses.map((course) => (
                      <ClassroomListItem key={course.id} course={course} onEnter={handleEnterClass} />
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}

export default Classroom;
