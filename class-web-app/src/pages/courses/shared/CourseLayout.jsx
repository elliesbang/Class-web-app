import { useEffect, useMemo, useState } from 'react';
import CourseTabs from './CourseTabs';
import VideoTab from './VideoTab';
import AssignmentTab from './AssignmentTab';
import FeedbackTab from './FeedbackTab';
import NoticeTab from './NoticeTab';
import MaterialsTab from './MaterialsTab';
import { hasCourseAccess, subscribeCourseAccessChanges } from '../../../lib/course-access';
import { subscribeAdminAuthChanges } from '../../../lib/auth';

const BASE_TAB_CONFIG = [
  { id: 'video', label: '영상 보기' },
  { id: 'assignment', label: '과제 업로드' },
  { id: 'feedback', label: '피드백 보기' },
  { id: 'notice', label: '공지' },
];

function CourseLayout({
  courseId,
  courseName,
  description = '수업 자료를 확인하고 과제를 제출하세요.',
  videoResources,
  notices,
  feedbacks,
  materials,
}) {
  const [hasAccess, setHasAccess] = useState(() => hasCourseAccess(courseId));
  const [activeTab, setActiveTab] = useState('video');

  const shouldDisplayMaterialsTab = materials !== undefined;

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

  const tabs = useMemo(() => {
    if (!shouldDisplayMaterialsTab) {
      return BASE_TAB_CONFIG;
    }

    return [
      BASE_TAB_CONFIG[0],
      { id: 'materials', label: '자료 보기' },
      ...BASE_TAB_CONFIG.slice(1),
    ];
  }, [shouldDisplayMaterialsTab]);

  const activeContent = useMemo(() => {
    switch (activeTab) {
      case 'assignment':
        return <AssignmentTab courseId={courseId} courseName={courseName} />;
      case 'feedback':
        return <FeedbackTab courseId={courseId} feedbacks={feedbacks} />;
      case 'notice':
        return <NoticeTab courseId={courseId} notices={notices} />;
      case 'materials':
        return <MaterialsTab courseName={courseName} materials={materials} />;
      case 'video':
      default:
        return <VideoTab courseId={courseId} courseName={courseName} videoResources={videoResources} />;
    }
  }, [activeTab, courseId, courseName, feedbacks, materials, notices, videoResources]);

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

      <CourseTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

      <section className="rounded-3xl bg-ivory p-6 shadow-soft">{activeContent}</section>
    </div>
  );
}

export default CourseLayout;
