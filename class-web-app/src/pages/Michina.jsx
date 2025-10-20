import { useMemo, useState } from 'react';
import MichinaTabs from '../components/MichinaTabs.jsx';
import MichinaVideo from '../components/michina/MichinaVideo.jsx';
import MichinaUpload from '../components/michina/MichinaUpload.jsx';
import MichinaNotice from '../components/michina/MichinaNotice.jsx';
import MichinaFeedback from '../components/michina/MichinaFeedback.jsx';

const TAB_CONFIG = [
  { id: 'video', label: '영상보기', icon: '🎬' },
  { id: 'upload', label: '과제 업로드', icon: '🖼' },
  { id: 'notice', label: '공지', icon: '📢' },
  { id: 'feedback', label: '피드백 보기', icon: '💬' },
];

function Michina() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('video');
  const [transitionKey, setTransitionKey] = useState(0);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!prev && activeTab !== 'video') {
        setActiveTab('video');
        setTransitionKey((key) => key + 1);
      }
      return next;
    });
  };

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    setActiveTab(tabId);
    setTransitionKey((key) => key + 1);
  };

  const activeContent = useMemo(() => {
    switch (activeTab) {
      case 'upload':
        return <MichinaUpload />;
      case 'notice':
        return <MichinaNotice />;
      case 'feedback':
        return <MichinaFeedback />;
      case 'video':
      default:
        return <MichinaVideo />;
    }
  }, [activeTab]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 pb-12">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">미치나 클래스</h1>
        <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">
          미치나 강의를 위한 전용 탭에서 영상 시청부터 과제 확인까지 한 번에 이용해보세요.
        </p>
      </header>

      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-ellieYellow px-6 py-3 text-base font-semibold text-ellieGray shadow-soft transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ellieYellow/80"
      >
        수강하기
      </button>

      {isOpen && (
        <MichinaTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabs={TAB_CONFIG}
        />
      )}

      {isOpen && (
        <section key={transitionKey} className="michina-fade rounded-3xl bg-ivory p-6 shadow-soft">
          {activeContent}
        </section>
      )}
    </div>
  );
}

export default Michina;
