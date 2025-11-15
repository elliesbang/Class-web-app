import React, { useState } from 'react';
import CourseCard from './CourseCard';

function AccordionCategory({ title, courses, accentColor }: { [key: string]: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="mb-4">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full rounded-2xl bg-white px-5 py-4 text-left shadow-soft transition-all duration-300 hover:-translate-y-0.5"
      >
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-ellieGray">{title}</span>
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-ellieGray ${
              isOpen ? 'bg-ellieYellow' : 'bg-ellieYellow/70'
            }`}
          >
            {isOpen ? '-' : '+'}
          </span>
        </div>
      </button>
      <div
        className={`grid overflow-hidden transition-[max-height] duration-300 ease-in-out ${
          isOpen ? 'max-h-96 mt-3 gap-3' : 'max-h-0'
        }`}
      >
        {isOpen &&
          courses.map((course: any) => (
            <CourseCard key={course.name} course={course} accentColor={accentColor} />
          ))}
      </div>
    </section>
  );
}

export default AccordionCategory;
