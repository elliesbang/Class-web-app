import { useMemo, useState } from 'react';
import VideoTab from './VideoTab';
import MaterialTab from './MaterialTab';
import UploadTab from './UploadTab';
import FeedbackTab from './FeedbackTab';
import NoticeTab from './NoticeTab';

const TAB_CONFIG = [
  { id: 'video', label: '영상 보기', icon: '🎬', Component: VideoTab },
  { id: 'materials', label: '자료 보기', icon: '📂', Component: MaterialTab },
  { id: 'upload', label: '과제 업로드', icon: '📝', Component: UploadTab },
  { id: 'feedback', label: '피드백 보기', icon: '💬', Component: FeedbackTab },
  { id: 'notice', label: '공지', icon: '📢', Component: NoticeTab },
];

function ClassroomTabs({ courseId, courseName, className = '' }) {
  const [activeTab, setActiveTab] = useState(TAB_CONFIG[0]?.id ?? 'video');

  const activeConfig = useMemo(() => {
    return TAB_CONFIG.find((tab) => tab.id === activeTab) ?? TAB_CONFIG[0];
  }, [activeTab]);

  const ActiveComponent = activeConfig?.Component ?? VideoTab;

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      <nav className="sticky top-0 z-10 rounded-3xl bg-white/90 p-2 shadow-soft backdrop-blur">
        <ul className="flex flex-wrap gap-2">
          {TAB_CONFIG.map((tab) => {
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
        <ActiveComponent courseId={courseId} courseName={courseName} />
      </section>
    </div>
  );
}

export default ClassroomTabs;
