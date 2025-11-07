import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classData from '../../data/classData.json';

const accordionButtonClasses =
  'w-full rounded-3xl bg-white px-6 py-5 text-left shadow-soft transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40';

const subCardClasses =
  'rounded-3xl bg-white px-5 py-4 shadow-soft transition-transform duration-200 hover:-translate-y-0.5';

function Classroom() {
  const navigate = useNavigate();
  const categories = useMemo(() => classData, []);
  const [openCategory, setOpenCategory] = useState(() => (categories[0] ? categories[0].category : null));

  const handleToggle = (category) => {
    setOpenCategory((current) => (current === category ? null : category));
  };

  const handleEnterClass = (title) => {
    if (!title) {
      return;
    }
    const encodedTitle = encodeURIComponent(title);
    navigate(`/class/${encodedTitle}`);
  };

  return (
    <div className="space-y-4 text-ellieGray" style={{ backgroundColor: '#fffdf6' }}>
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold">내부 강의실</h1>
        <p className="mt-2 text-sm text-ellieGray/70">
          상위 카테고리를 눌러 하위 강의를 펼치고, 원하는 수업의 수강하기 버튼을 눌러 바로 이동해보세요.
        </p>
      </header>

      <div className="space-y-3">
        {categories.map((category) => {
          const isOpen = openCategory === category.category;
          const hasSingle = Boolean(category.classSingle);
          const hasList = Array.isArray(category.classes) && category.classes.length > 0;

          return (
            <section key={category.category} className="space-y-3">
              <button
                type="button"
                onClick={() => handleToggle(category.category)}
                className={accordionButtonClasses}
                aria-expanded={isOpen}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{category.category}</span>
                  <span className="text-xl font-semibold">{isOpen ? '−' : '+'}</span>
                </div>
              </button>

              <div
                className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="space-y-3 overflow-hidden">
                  {hasList &&
                    category.classes.map((classItem) => (
                      <article key={classItem.title} className={subCardClasses}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-ellieGray">{classItem.title}</h3>
                            {classItem.desc ? (
                              <p className="mt-1 text-sm text-ellieGray/70">{classItem.desc}</p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEnterClass(classItem.title)}
                            className="inline-flex w-full justify-center rounded-full px-4 py-2 text-sm font-semibold text-ellieGray shadow-soft transition-colors duration-200 sm:w-auto"
                            style={{ backgroundColor: '#ffd331' }}
                          >
                            수강하기
                          </button>
                        </div>
                      </article>
                    ))}

                  {hasSingle && (
                    <article className={subCardClasses}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-ellieGray">{category.classSingle.title}</h3>
                          {category.classSingle.desc ? (
                            <p className="mt-1 text-sm text-ellieGray/70">{category.classSingle.desc}</p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEnterClass(category.classSingle.title)}
                          className="inline-flex w-full justify-center rounded-full px-4 py-2 text-sm font-semibold text-ellieGray shadow-soft transition-colors duration-200 sm:w-auto"
                          style={{ backgroundColor: '#ffd331' }}
                        >
                          수강하기
                        </button>
                      </div>
                    </article>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default Classroom;
