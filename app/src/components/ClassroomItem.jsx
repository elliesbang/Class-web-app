import React from 'react';
import { useNavigate } from 'react-router-dom';

const ClassroomItem = ({ classroom, onEnter }) => {
  const navigate = useNavigate();

  const handleEnter = () => {
    if (typeof onEnter === 'function') {
      onEnter(classroom);
    }
    navigate(`/class/${classroom.id}`);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#f1e6c7] bg-white/80 p-4 text-sm text-ellieGray shadow-inner transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-base font-semibold text-ellieGray">{classroom.name}</p>
        {classroom.description ? (
          <p className="mt-1 text-xs text-ellieGray/70">{classroom.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-full bg-[#ffd331] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ellieGray shadow-soft transition hover:bg-[#ffca0a]"
        onClick={handleEnter}
      >
        수강하기
      </button>
    </div>
  );
};

export default ClassroomItem;
