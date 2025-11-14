import { useMemo, useState } from 'react';
import ClassroomPreviewCard from '../components/classroom/ClassroomPreviewCard.jsx';

const categories = [
  {
    title: '스킬',
    courses: ['캔디마', '캔디업', '중캘업'],
  },
  {
    title: '수익화',
    courses: ['캔굿즈', '캘굿즈'],
  },
  {
    title: 'AI 창작',
    courses: ['에그작', '에그작챌', '나컬작', '나컬작챌', '미치나'],
  },
];

function Classroom() {
  const [openCategory, setOpenCategory] = useState(null);

  const memoizedCategories = useMemo(() => categories, []);

  const handleToggle = (title) => {
    setOpenCategory((prev) => (prev === title ? null : title));
  };

  return (
    <div className="space-y-4 text-ellieGray" style={{ backgroundColor: '#fffdf6' }}>
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold">내부 강의실</h1>
        <p className="mt-2 text-sm text-ellieGray/70">
          새로운 스킬, 수익화, AI 창작 카테고리로 정리된 강의실에서 원하는 수업을 찾아보세요.
        </p>
      </header>

      <div className="space-y-3">
        {memoizedCategories.map((category) => {
          const isOpen = openCategory === category.title;
          return (
            <section key={category.title} className="rounded-3xl bg-white p-1 shadow-soft">
              <button
                type="button"
                onClick={() => handleToggle(category.title)}
                className="flex w-full items-center justify-between rounded-3xl bg-white px-5 py-4 text-left text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fef568]/60"
              >
                <span>{category.title}</span>
                <span className="text-2xl">{isOpen ? '−' : '+'}</span>
              </button>
              <div
                className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${
                  isOpen ? 'max-h-[3000px]' : 'max-h-0'
                }`}
              >
                <div className="grid gap-3 px-1 pb-4 pt-1 sm:grid-cols-1 md:grid-cols-2">
                  {category.courses.map((course) => (
                    <ClassroomPreviewCard key={course} courseName={course} />
                  ))}
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
