import React from 'react';

function ClassroomListItem({ course, onEnter }) {
  if (!course || course.hidden === true) {
    return null;
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-ellieGray">{course.name}</h2>
          {course.description ? (
            <p className="mt-1 text-sm leading-relaxed text-ellieGray/70">{course.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onEnter?.(course.id)}
          className="inline-flex w-full justify-center rounded-full px-5 py-2 text-sm font-semibold text-ellieGray shadow-soft transition-transform duration-200 hover:-translate-y-0.5 sm:w-auto"
          style={{ backgroundColor: '#ffd331' }}
        >
          수강하기
        </button>
      </div>
    </div>
  );
}

export default ClassroomListItem;
