import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const accordionData = [
  {
    name: '스킬',
    courses: [
      { title: '캔디마', description: '과정 소개가 여기에 표시됩니다.' },
      { title: '캔디업', description: '과정 소개가 여기에 표시됩니다.' },
      { title: '중캘업', description: '과정 소개가 여기에 표시됩니다.' },
    ],
  },
  {
    name: '수익화',
    courses: [
      { title: '캔굿즈', description: '과정 소개가 여기에 표시됩니다.' },
      { title: '캘굿즈', description: '과정 소개가 여기에 표시됩니다.' },
    ],
  },
  {
    name: 'AI 창작',
    courses: [
      { title: '에그작', description: '과정 소개가 여기에 표시됩니다.' },
      { title: '에그작챌', description: '과정 소개가 여기에 표시됩니다.' },
      { title: '나컬작', description: '과정 소개가 여기에 표시됩니다.' },
      { title: '나컬작챌', description: '과정 소개가 여기에 표시됩니다.' },
      { title: '미치나', description: '과정 소개가 여기에 표시됩니다.' },
    ],
  },
];

function Classroom() {
  const navigate = useNavigate();
  const [openCategory, setOpenCategory] = useState(null);

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
    <div className="min-h-screen bg-[#fffdf6] text-ellieGray">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
        <header className="rounded-3xl bg-[#fef568] px-6 py-6 shadow-soft">
          <h1 className="text-2xl font-bold text-ellieGray">강의실</h1>
          <p className="mt-3 text-sm leading-relaxed text-ellieGray/70">
            새로운 스킬과 수익화를 위한 강의를 확인하고 수강을 시작해보세요.
          </p>
        </header>

        <section className="space-y-4">
          {accordionData.map((category) => {
            const isOpen = openCategory === category.name;

            return (
              <article key={category.name} className="rounded-3xl bg-transparent">
                <button
                  type="button"
                  onClick={() => handleToggle(category.name)}
                  className="flex w-full items-center justify-between rounded-3xl bg-white px-6 py-5 text-left shadow-soft transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
                  aria-expanded={isOpen}
                  aria-controls={`${category.name}-panel`}
                >
                  <span className="text-lg font-semibold">{category.name}</span>
                  <span className="text-xl font-semibold">{isOpen ? '−' : '+'}</span>
                </button>

                <div
                  id={`${category.name}-panel`}
                  className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] pt-4' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="space-y-3 overflow-hidden">
                    {category.courses.map((course) => (
                      <div
                        key={course.title}
                        className="rounded-3xl bg-white p-5 shadow-soft transition-transform duration-200 hover:-translate-y-0.5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h2 className="text-base font-semibold text-ellieGray">{course.title}</h2>
                            <p className="mt-1 text-sm leading-relaxed text-ellieGray/70">{course.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEnterClass(course.title)}
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
