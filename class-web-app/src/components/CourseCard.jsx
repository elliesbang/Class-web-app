import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function CourseCard({ course, accentColor }) {
  const { name, link, description, linkState } = course;
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    if (!showNotice) {
      return undefined;
    }

    const timer = window.setTimeout(() => setShowNotice(false), 2400);
    return () => window.clearTimeout(timer);
  }, [showNotice]);

  const handleUnavailableClick = () => {
    setShowNotice(true);
  };

  const actionClasses =
    'inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium text-ellieGray shadow-soft transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ellieYellow/80';

  return (
    <article className="rounded-3xl bg-white px-5 py-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-ellieGray">{name}</h3>
        {link ? (
          <Link
            to={link}
            state={linkState}
            className={actionClasses}
            style={{ backgroundColor: accentColor }}
          >
            수강하기
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleUnavailableClick}
            className={actionClasses}
            style={{ backgroundColor: accentColor }}
          >
            수강하기
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-ellieGray/70">
        {showNotice
          ? '현재 준비 중인 강의입니다. 오픈 소식은 곧 안내드릴게요!'
          : description ?? `엘리의방 전용 강의실에서 ${name} 강의를 만나보세요.`}
      </p>
    </article>
  );
}

export default CourseCard;
