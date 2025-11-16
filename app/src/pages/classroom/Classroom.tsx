import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ClassroomListItem from '../../components/ClassroomListItem';
import { useSheetsData } from '../../contexts/SheetsDataContext';

function Classroom() {
  const navigate = useNavigate();
  const { lectureCourses, loading } = useSheetsData();
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const categorizedCategories = useMemo(() => {
    const categoryMap = new Map<
      string,
      { id: string; name: string; order: number; courses: Array<{ id: string; name: string; description?: string }> }
    >();

    lectureCourses.forEach((course) => {
      if (!categoryMap.has(course.categoryId)) {
        categoryMap.set(course.categoryId, {
          id: course.categoryId,
          name: course.categoryName,
          order: course.categoryOrder,
          courses: [],
        });
      }
      const category = categoryMap.get(course.categoryId)!;
      category.courses.push({
        id: course.courseId,
        name: course.courseName,
        description: course.courseDescription,
      });
    });

    return Array.from(categoryMap.values())
      .map((category) => ({
        ...category,
        courses: category.courses.sort((a, b) => a.name.localeCompare(b.name, 'ko', { sensitivity: 'base' })),
      }))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'ko', { sensitivity: 'base' }));
  }, [lectureCourses]);

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
          {loading ? (
            <p className="text-sm text-ellieGray/70">강의실 데이터를 불러오는 중입니다...</p>
          ) : categorizedCategories.length === 0 ? (
            <p className="text-sm text-ellieGray/70">표시할 강의실 카테고리가 없습니다.</p>
          ) : (
            categorizedCategories.map((category) => {
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
            })
          )}
        </section>
      </div>
    </div>
  );
}

export default Classroom;
