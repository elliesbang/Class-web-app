import { useMemo, useState } from 'react';

const PREVIEW_TABS = [
  { id: 'intro', label: '강의 소개', placeholder: '강의 소개 내용이 여기에 들어갑니다.' },
  { id: 'sessions', label: '회차 목록', placeholder: 'VOD/주차 정보가 순서대로 표시됩니다.' },
  { id: 'assignment', label: '과제 업로드', placeholder: '수강생이 과제를 업로드하는 영역입니다.' },
  { id: 'feedback', label: '피드백', placeholder: '제출된 과제에 대한 피드백이 노출됩니다.' },
];

function ClassroomPreviewCard({ courseName }) {
  const [activeTab, setActiveTab] = useState(PREVIEW_TABS[0]?.id ?? 'intro');

  const activeTabContent = useMemo(() => {
    return PREVIEW_TABS.find((tab) => tab.id === activeTab)?.placeholder ?? '';
  }, [activeTab]);

  return (
    <article className="flex flex-col gap-5 rounded-3xl bg-white p-6 shadow-soft">
      <div>
        <h3 className="text-lg font-bold text-ellieGray">{courseName}</h3>
        <p className="mt-2 text-sm text-ellieGray/70">과정 소개 문구가 들어갈 자리입니다. 자세한 설명은 추후 업데이트됩니다.</p>
      </div>

      <nav className="rounded-2xl bg-ivory p-1 shadow-inner">
        <ul className="flex flex-wrap gap-2">
          {PREVIEW_TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <li key={tab.id} className="flex-1 min-w-[120px]">
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fef568]/60 ${
                    isActive
                      ? 'bg-[#fef568] text-ellieGray shadow-soft'
                      : 'bg-transparent text-ellieGray/60 hover:bg-[#fef568]/20'
                  }`}
                >
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className="rounded-2xl bg-ivory p-6 text-sm leading-relaxed text-ellieGray shadow-soft">
        {activeTabContent}
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-full bg-[#fef568] px-6 py-2 text-sm font-semibold text-ellieGray shadow-soft transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fef568]/60"
        >
          수강하기
        </button>
      </div>
    </article>
  );
}

export default ClassroomPreviewCard;
