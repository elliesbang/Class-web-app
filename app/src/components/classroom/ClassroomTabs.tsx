import React from 'react';
import { NavLink } from 'react-router-dom';

function ClassroomTabs({ classId }: { classId?: string }) {
  if (!classId) return null;

  return (
    <nav className="sticky top-0 z-10 rounded-3xl bg-white/90 p-2 shadow-soft backdrop-blur">
      <ul className="flex flex-wrap gap-2">
        <li className="min-w-[120px] flex-1">
          <NavLink
            to={`/classroom/${classId}/video`}
            className={({ isActive }) =>
              `flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ellieYellow/80 ${
                isActive ? 'bg-ellieYellow text-ellieGray shadow-soft' : 'bg-transparent text-[#8e8e8e] hover:bg-ellieYellow/10'
              }`
            }
          >
            강의실 영상
          </NavLink>
        </li>
        <li className="min-w-[120px] flex-1">
          <NavLink
            to={`/classroom/${classId}/material`}
            className={({ isActive }) =>
              `flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ellieYellow/80 ${
                isActive ? 'bg-ellieYellow text-ellieGray shadow-soft' : 'bg-transparent text-[#8e8e8e] hover:bg-ellieYellow/10'
              }`
            }
          >
            자료
          </NavLink>
        </li>
        <li className="min-w-[120px] flex-1">
          <NavLink
            to={`/classroom/${classId}/notice`}
            className={({ isActive }) =>
              `flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ellieYellow/80 ${
                isActive ? 'bg-ellieYellow text-ellieGray shadow-soft' : 'bg-transparent text-[#8e8e8e] hover:bg-ellieYellow/10'
              }`
            }
          >
            강의실 공지
          </NavLink>
        </li>
        <li className="min-w-[120px] flex-1">
          <NavLink
            to={`/classroom/${classId}/assignment`}
            className={({ isActive }) =>
              `flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ellieYellow/80 ${
                isActive ? 'bg-ellieYellow text-ellieGray shadow-soft' : 'bg-transparent text-[#8e8e8e] hover:bg-ellieYellow/10'
              }`
            }
          >
            과제
          </NavLink>
        </li>
        <li className="min-w-[120px] flex-1">
          <NavLink
            to={`/classroom/${classId}/feedback`}
            className={({ isActive }) =>
              `flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ellieYellow/80 ${
                isActive ? 'bg-ellieYellow text-ellieGray shadow-soft' : 'bg-transparent text-[#8e8e8e] hover:bg-ellieYellow/10'
              }`
            }
          >
            피드백
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default ClassroomTabs;
