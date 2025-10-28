import { useEffect, useState } from 'react';
import ClassroomTabs from '@/components/classroom/ClassroomTabs';
import { hasCourseAccess, subscribeCourseAccessChanges } from '../../../lib/course-access';
import { subscribeAdminAuthChanges } from '../../../lib/auth';

function CourseLayout({
  courseId,
  courseName,
  description = '수업 자료를 확인하고 과제를 제출하세요.',
}) {
  const [hasAccess, setHasAccess] = useState(() => hasCourseAccess(courseId));

  useEffect(() => {
    const updateAccess = () => {
      setHasAccess(hasCourseAccess(courseId));
    };

    updateAccess();

    const unsubscribeAccess = subscribeCourseAccessChanges(updateAccess);
    const unsubscribeAdmin = subscribeAdminAuthChanges(updateAccess);

    return () => {
      unsubscribeAccess();
      unsubscribeAdmin();
    };
  }, [courseId]);

  if (!hasAccess) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-12">
        <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
          <h1 className="text-xl font-bold text-ellieGray">{courseName}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">{description}</p>
        </header>

        <section className="rounded-3xl bg-ivory p-6 text-center shadow-soft">
          <h2 className="text-lg font-semibold text-ellieGray">접근이 제한된 강의실입니다</h2>
          <p className="mt-3 text-sm leading-relaxed text-ellieGray/70">
            수강 중인 클래스로 등록되어 있는지 확인해주세요. 관리자 계정으로 로그인하면 모든 강의실을 바로 확인할 수 있습니다.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-12">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">{courseName}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">{description}</p>
      </header>

      <ClassroomTabs courseId={courseId} courseName={courseName} />
    </div>
  );
}

export default CourseLayout;
