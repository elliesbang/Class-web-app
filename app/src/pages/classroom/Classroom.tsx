import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { classroomCategories } from '../../lib/contentLibrary';

function Classroom() {
  const navigate = useNavigate();
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const categories = useMemo(() => classroomCategories, []);

  const handleToggle = (categoryId: string) => {
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
          {categories.map((category) => {
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
                      <div
                        key={course.id}
                        className="rounded-3xl bg-white p-5 shadow-soft transition-transform duration-200 hover:-translate-y-0.5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h2 className="text-base font-semibold text-ellieGray">{course.name}</h2>
                            {course.description ? (
                              <p className="mt-1 text-sm leading-relaxed text-ellieGray/70">{course.description}</p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEnterClass(course.id)}
                            className="inline-flex w-full justify-center rounded-full px-5 py-2 text-sm font-semibold text-ellieGray shadow-soft transition-transform duration-200 hover:-translate-y-0.5 sm:w-auto"
                            style={{ backgroundColor: '#ffd331' }}
                          >
                            수강하기
                          </button>
                        </div>
                      </div>
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
