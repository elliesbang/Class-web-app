import React, { useEffect, useMemo, useState } from 'react';
import { hasCourseAccess, subscribeCourseAccessChanges } from '@/lib/course-access';
import { useAuthUser } from '@/hooks/useAuthUser';
import AssignmentTab from '@/pages/Classroom/tabs/AssignmentTab';
import VideoTab from '@/pages/Classroom/tabs/VideoTab';
import MaterialTab from '@/pages/Classroom/tabs/MaterialTab';
import UploadTab from './UploadTab';
import FeedbackTab from '@/pages/Classroom/tabs/FeedbackTab';
import NoticeTab from '@/pages/Classroom/tabs/NoticeTab';

const TAB_CONFIG: any[] = [
  { id: 'video', label: '강의실 영상', icon: '🎬', Component: VideoTab },
  { id: 'materials', label: '자료', icon: '📂', Component: MaterialTab },
  { id: 'notice', label: '강의실 공지', icon: '📢', Component: NoticeTab },
  { id: 'assignment', label: '과제', icon: '📝', Component: AssignmentTab },
  { id: 'feedback', label: '피드백', icon: '💬', Component: FeedbackTab },
];

function ClassroomTabs({ courseId, courseName, className = '' }: { [key: string]: any }) {
  const [activeTab, setActiveTab] = useState(TAB_CONFIG[0]?.id ?? 'video');
  const authUser = useAuthUser();
  const [hasAccess, setHasAccess] = useState(() => hasCourseAccess(courseId) || authUser?.role === 'admin');
  const [contents, setContents] = useState<any[]>([]);
  const [isLoadingContents, setIsLoadingContents] = useState(false);
  const [contentError, setContentError] = useState<any>(null);

  useEffect(() => {
    const updateAccess = () => {
      setHasAccess(hasCourseAccess(courseId) || authUser?.role === 'admin');
    };

    updateAccess();

    const unsubscribeAccess = subscribeCourseAccessChanges(updateAccess);

    return () => {
      unsubscribeAccess();
    };
  }, [authUser?.role, courseId]);

  useEffect(() => {
    setContents([]);
    setIsLoadingContents(false);
    setContentError(null);

    // const loadContents = async () => {
    //   if (!courseId) {
    //     setContents([]);
    //     setContentError('강의 정보를 불러오지 못했습니다.');
    //     return;
    //   }
    //
    //   setIsLoadingContents(true);
    //   setContentError(null);
    //
    //   try {
    //     const query = new URLSearchParams({ class_id: String(courseId) });
    //     const response = await fetch(`/.netlify/functions/students/contents?${query.toString()}`);
    //     if (!response.ok) {
    //       throw new Error(`Failed to fetch contents. status=${response.status}`);
    //     }
    //
    //     const text = await response.text();
    //     if (cancelled) {
    //       return;
    //     }
    //
    //     if (!text) {
    //       setContents([]);
    //       return;
    //     }
    //
    //     try {
    //       const payload = JSON.parse(text);
    //       const data = Array.isArray(payload?.data)
    //         ? payload.data
    //         : Array.isArray(payload?.results)
    //         ? payload.results
    //         : Array.isArray(payload?.contents)
    //         ? payload.contents
    //         : [];
    //       setContents(data);
    //     } catch (error) {
    //       console.error('[ClassroomTabs] Failed to parse contents response', error);
    //       setContentError('콘텐츠 정보를 불러오는 중 문제가 발생했습니다.');
    //       setContents([]);
    //     }
    //   } catch (error) {
    //     if (!cancelled) {
    //       console.error('[ClassroomTabs] Failed to load contents', error);
    //       setContentError('콘텐츠 정보를 불러오는 중 문제가 발생했습니다.');
    //       setContents([]);
    //     }
    //   } finally {
    //     if (!cancelled) {
    //       setIsLoadingContents(false);
    //     }
    //   }
    // };

    // void loadContents();
  }, [courseId]);

  const containerClassName = `space-y-4 ${className}`.trim();

  const activeConfig = useMemo(() => {
    return TAB_CONFIG.find((tab) => tab.id === activeTab) ?? TAB_CONFIG[0];
  }, [activeTab]);

  const ActiveComponent = activeConfig?.Component ?? VideoTab;

  if (!hasAccess) {
    return (
      <div className={containerClassName}>
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
    <div className={containerClassName}>
      <nav className="sticky top-0 z-10 rounded-3xl bg-white/90 p-2 shadow-soft backdrop-blur">
        <ul className="flex flex-wrap gap-2">
          {TAB_CONFIG.map((tab: any) => {
            const isActive = tab.id === activeTab;
            return (
              <li key={tab.id} className="min-w-[120px] flex-1">
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ellieYellow/80 ${
                    isActive
                      ? 'bg-ellieYellow text-ellieGray shadow-soft'
                      : 'bg-transparent text-[#8e8e8e] hover:bg-ellieYellow/10'
                  }`}
                >
                  <span aria-hidden>{tab.icon}</span>
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className="rounded-3xl bg-ivory p-6 shadow-soft">
        <ActiveComponent
          courseId={courseId}
          courseName={courseName}
          contents={contents}
          isLoadingContents={isLoadingContents}
          contentError={contentError}
        />
      </section>
    </div>
  );
}

export default ClassroomTabs;
