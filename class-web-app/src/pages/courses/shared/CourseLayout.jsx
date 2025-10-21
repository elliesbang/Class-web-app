import { useMemo, useState } from 'react';
import CourseTabs from './CourseTabs';
import VideoTab from './VideoTab';
import AssignmentTab from './AssignmentTab';
import FeedbackTab from './FeedbackTab';
import NoticeTab from './NoticeTab';

const TAB_CONFIG = [
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
}) {
  const [activeTab, setActiveTab] = useState('video');

  const activeContent = useMemo(() => {
    switch (activeTab) {
      case 'assignment':
        return <AssignmentTab courseId={courseId} courseName={courseName} />;
      case 'feedback':
        return <FeedbackTab courseId={courseId} feedbacks={feedbacks} />;
      case 'notice':
        return <NoticeTab courseId={courseId} notices={notices} />;
      case 'video':
      default:
        return <VideoTab courseId={courseId} courseName={courseName} videoResources={videoResources} />;
    }
  }, [activeTab, courseId, courseName, feedbacks, notices, videoResources]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-12">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">{courseName}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">{description}</p>
      </header>

      <CourseTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={TAB_CONFIG} />

      <section className="rounded-3xl bg-ivory p-6 shadow-soft">{activeContent}</section>
    </div>
  );
}

export default CourseLayout;
