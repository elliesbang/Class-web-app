import React, { useEffect, useMemo, useState } from 'react';

import AssignmentTab from '@/pages/Classroom/tabs/AssignmentTab';
import FeedbackTab from '@/pages/Classroom/tabs/FeedbackTab';
import MaterialTab from '@/pages/Classroom/tabs/MaterialTab';
import NoticeTab from '@/pages/Classroom/tabs/NoticeTab';
import VideoTab from '@/pages/Classroom/tabs/VideoTab';

const TAB_CONFIG: any[] = [
  { id: 'video', label: '강의실 영상', Component: VideoTab },
  { id: 'materials', label: '자료', Component: MaterialTab },
  { id: 'notice', label: '강의실 공지', Component: NoticeTab },
  { id: 'assignment', label: '과제', Component: AssignmentTab },
  { id: 'feedback', label: '피드백', Component: FeedbackTab },
];

function ClassroomTabs({ courseId, courseName, className = '' }: { [key: string]: any }) {
  const [activeTab, setActiveTab] = useState(TAB_CONFIG[0]?.id ?? 'video');
  const [contents, setContents] = useState<any[]>([]);
  const [isLoadingContents, setIsLoadingContents] = useState(false);
  const [contentError, setContentError] = useState<any>(null);

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
