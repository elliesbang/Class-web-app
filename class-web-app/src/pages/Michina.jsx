import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import ClassroomTabs from '@/components/classroom/ClassroomTabs';

function Michina() {
  const location = useLocation();
  const courseId = 'michina';
  const courseName = '미치나';
  const initialOpen = location.state?.autoOpen ?? false;
  const [isOpen, setIsOpen] = useState(initialOpen);

  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 pb-12">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">{courseName} 클래스</h1>
        <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">
          {courseName} 수강생을 위한 전용 강의실입니다. 영상, 자료, 과제, 피드백, 공지를 하나의 탭에서 편리하게 확인하세요.
        </p>
      </header>

      {!isOpen ? (
        <button
          type="button"
          onClick={handleToggle}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-ellieYellow px-6 py-3 text-base font-semibold text-ellieGray shadow-soft transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ellieYellow/80"
        >
          수강하기
        </button>
      ) : null}

      {isOpen ? <ClassroomTabs courseId={courseId} courseName={courseName} /> : null}
    </div>
  );
}

export default Michina;
