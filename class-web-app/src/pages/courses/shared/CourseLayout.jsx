import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseTabs from './CourseTabs';
import VideoTab from './VideoTab';
import AssignmentTab from './AssignmentTab';
import FeedbackTab from './FeedbackTab';
import NoticeTab from './NoticeTab';
import MaterialsTab from './MaterialsTab';
import { getStoredStudentAccess } from '../../../lib/auth';
import { getClassNameBySlug, normaliseClassName } from '../../../lib/classAccess';

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
  const [activeTab, setActiveTab] = useState('video');
  const navigate = useNavigate();

  useEffect(() => {
    const expectedClassName = getClassNameBySlug(courseId);
    if (!expectedClassName || typeof window === 'undefined') {
      return;
    }

    const storedAccess = getStoredStudentAccess();
    if (storedAccess.length === 0) {
      window.alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }

    const expectedName = normaliseClassName(expectedClassName);
    const hasAccess = storedAccess.some((record) => normaliseClassName(record.className) === expectedName);

    if (!hasAccess) {
      window.alert('수강 내역이 없습니다.');
      navigate('/mypage');
    }
  }, [courseId, navigate]);

  const shouldDisplayMaterialsTab = materials !== undefined;

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
