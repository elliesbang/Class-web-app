import { useMemo, useState } from 'react';

const tabs = [
  { key: 'video', label: '🎥 영상 보기' },
  { key: 'notice', label: '📢 공지 보기' },
  { key: 'assignment', label: '🖼️ 과제 업로드' },
  { key: 'resources', label: '📂 자료 보기' },
  { key: 'feedback', label: '💬 피드백 보기' },
];

const tabButtonBase =
  'flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd331]/60';

function ClassDetail({ classItem }) {
  const [activeTab, setActiveTab] = useState('video');
  const safeNotices = useMemo(() => classItem?.notice ?? [], [classItem]);
  const safeResources = useMemo(() => classItem?.resources ?? [], [classItem]);
  const safeFeedback = useMemo(() => classItem?.feedback ?? [], [classItem]);

  const renderVideo = () => {
    if (!classItem?.videoUrl) {
      return (
        <div className="rounded-3xl bg-white px-6 py-8 text-center text-sm text-ellieGray/70 shadow-soft">
          <p>등록된 영상이 없습니다. 추후 안내를 기다려주세요.</p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
        <div className="aspect-video w-full">
          <iframe
            src={classItem.videoUrl}
            title={`${classItem.title} 영상`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  };

  const renderNotice = () => {
    if (!safeNotices.length) {
      return (
        <div className="rounded-3xl bg-white px-6 py-8 text-center text-sm text-ellieGray/70 shadow-soft">
          <p>등록된 공지가 없습니다.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {safeNotices.map((notice) => (
          <article key={notice.title} className="rounded-3xl bg-white px-6 py-5 shadow-soft">
            <h3 className="text-base font-semibold text-ellieGray">{notice.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">{notice.content}</p>
          </article>
        ))}
      </div>
    );
  };

  const renderAssignment = () => (
    <form className="space-y-4 rounded-3xl bg-white px-6 py-5 shadow-soft">
      <div>
        <label className="block text-sm font-semibold text-ellieGray" htmlFor="assignment-image">
          과제 이미지 업로드
        </label>
        <input
          id="assignment-image"
          type="file"
          accept="image/*"
          className="mt-2 w-full rounded-2xl border border-ellieGray/20 bg-ivory px-4 py-2 text-sm text-ellieGray focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/50"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-ellieGray" htmlFor="assignment-link">
          외부 링크 제출
        </label>
        <input
          id="assignment-link"
          type="url"
          placeholder="https://"
          className="mt-2 w-full rounded-2xl border border-ellieGray/20 bg-ivory px-4 py-2 text-sm text-ellieGray focus:border-[#ffd331] focus:outline-none focus:ring-2 focus:ring-[#ffd331]/50"
        />
      </div>
      <button
        type="button"
        className="w-full rounded-full px-4 py-2 text-sm font-semibold text-ellieGray shadow-soft transition-colors duration-200"
        style={{ backgroundColor: '#ffd331' }}
      >
        제출하기
      </button>
      <p className="text-xs leading-relaxed text-ellieGray/60">
        이미지는 10MB 이하로 업로드해 주세요. 링크 제출 시 공유 권한을 확인해 주세요.
      </p>
    </form>
  );

  const renderResources = () => {
    if (!safeResources.length) {
      return (
        <div className="rounded-3xl bg-white px-6 py-8 text-center text-sm text-ellieGray/70 shadow-soft">
          <p>등록된 자료가 없습니다.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {safeResources.map((resource) => (
          <article key={`${resource.name}-${resource.url}`} className="rounded-3xl bg-white px-6 py-5 shadow-soft">
            <h3 className="text-base font-semibold text-ellieGray">{resource.name}</h3>
            <div className="mt-3">
              {resource.type === 'file' ? (
                <a
                  href={resource.url}
                  download
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-ellieGray shadow-soft transition-colors duration-200"
                  style={{ backgroundColor: '#ffd331' }}
                >
                  파일 다운로드
                </a>
              ) : (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-ellieGray shadow-soft transition-colors duration-200"
                  style={{ backgroundColor: '#ffd331' }}
                >
                  링크 열기
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    );
  };

  const renderFeedback = () => {
    if (!safeFeedback.length) {
      return (
        <div className="rounded-3xl bg-white px-6 py-8 text-center text-sm text-ellieGray/70 shadow-soft">
          <p>등록된 피드백이 없습니다.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {safeFeedback.map((item, index) => (
          <article key={`${item.week ?? index}-feedback`} className="rounded-3xl bg-white px-6 py-5 shadow-soft">
            <h3 className="text-base font-semibold text-ellieGray">
              {item.week ? `${item.week}주차 피드백` : '피드백'}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ellieGray/70">{item.content}</p>
          </article>
        ))}
      </div>
    );
  };

  return (
    <section className="space-y-5">
      <div className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ellieGray">{classItem?.title ?? '강의 정보'}</h2>
        {classItem?.desc ? (
          <p className="mt-2 text-sm text-ellieGray/70">{classItem.desc}</p>
        ) : null}
      </div>

      <nav className="flex gap-2 rounded-3xl bg-white p-2 shadow-soft">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`${tabButtonBase} ${isActive ? 'text-ellieGray' : 'text-ellieGray/70'}`}
              style={{ backgroundColor: isActive ? '#ffd331' : '#fffdf6' }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === 'video' && renderVideo()}
      {activeTab === 'notice' && renderNotice()}
      {activeTab === 'assignment' && renderAssignment()}
      {activeTab === 'resources' && renderResources()}
      {activeTab === 'feedback' && renderFeedback()}
    </section>
  );
}

export default ClassDetail;
