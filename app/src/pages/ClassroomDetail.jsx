import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const normalizeResults = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
};

function ClassroomDetail() {
  const { id: classroomId = '' } = useParams();
  const navigate = useNavigate();
  const [classroomDetail, setClassroomDetail] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [tabContent, setTabContent] = useState([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [isLoadingTabs, setIsLoadingTabs] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!classroomId) return;
    const controller = new AbortController();

    const loadDetail = async () => {
      setIsLoadingDetail(true);
      setError('');
      try {
        const response = await fetch(`/api/classroom/detail?class_id=${classroomId}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('강의실 정보를 불러오지 못했습니다.');
        }
        const payload = await response.json();
        const [first] = normalizeResults(payload);
        setClassroomDetail(first || null);
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setError(fetchError.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingDetail(false);
        }
      }
    };

    loadDetail();

    return () => controller.abort();
  }, [classroomId]);

  useEffect(() => {
    if (!classroomId) return;
    const controller = new AbortController();

    const loadTabs = async () => {
      setIsLoadingTabs(true);
      setError('');
      try {
        const response = await fetch(`/api/classroom/tabs?class_id=${classroomId}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error('탭 정보를 불러오지 못했습니다.');
        }
        const payload = await response.json();
        const nextTabs = normalizeResults(payload);
        setTabs(nextTabs);
        if (nextTabs.length > 0) {
          setActiveTab(nextTabs[0].tab || nextTabs[0].tab_key || nextTabs[0].id || nextTabs[0].key);
        }
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setError(fetchError.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingTabs(false);
        }
      }
    };

    loadTabs();

    return () => controller.abort();
  }, [classroomId]);

  useEffect(() => {
    if (!classroomId || !activeTab) return;
    const controller = new AbortController();

    const loadContent = async () => {
      setIsLoadingContent(true);
      setError('');
      try {
        const query = new URLSearchParams({ class_id: classroomId, tab: activeTab });
        const response = await fetch(`/api/classroom/content?${query.toString()}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error('탭 콘텐츠를 불러오지 못했습니다.');
        }
        const payload = await response.json();
        setTabContent(normalizeResults(payload));
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setError(fetchError.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingContent(false);
        }
      }
    };

    loadContent();

    return () => controller.abort();
  }, [classroomId, activeTab]);

  const renderContentBody = (item) => {
    const title = item.title || item.heading || item.name || '';
    const description = item.description || item.body || item.summary || '';
    const link = item.link_url || item.url;
    const media = item.media_url || item.video_url;

    return (
      <li key={item.id || item.content_id || title} className="rounded-2xl border border-[#f1e6c7] bg-[#fffaf2] p-4 shadow-soft">
        {title ? <h3 className="text-lg font-semibold text-ellieGray">{title}</h3> : null}
        {description ? <p className="mt-2 text-sm text-ellieGray/70">{description}</p> : null}
        {link ? (
          <a className="mt-3 inline-block text-sm font-semibold text-[#d98200] underline" href={link} target="_blank" rel="noreferrer">
            링크 열기
          </a>
        ) : null}
        {media ? (
          <div className="mt-3 overflow-hidden rounded-xl bg-black/5">
            <video src={media} controls className="w-full" />
          </div>
        ) : null}
      </li>
    );
  };

  if (!classroomId) {
    return (
      <div className="min-h-screen bg-[#fffdf6] p-6 text-center text-ellieGray">
        <p>강의실 ID가 올바르지 않습니다.</p>
      </div>
    );
  }

  const classroomTitle = classroomDetail?.title || classroomDetail?.name || classroomId;
  const classroomSubtitle = classroomDetail?.subtitle || classroomDetail?.description;

  return (
    <div className="min-h-screen bg-[#fffdf6] py-6 text-ellieGray">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-ellieGray shadow-soft"
        >
          ← 강의실 목록으로
        </button>

        <header className="rounded-3xl bg-white px-6 py-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#ff9900]">강의실</p>
          <h1 className="mt-1 text-2xl font-bold">{isLoadingDetail ? '로딩 중...' : classroomTitle}</h1>
          <p className="mt-2 text-sm text-ellieGray/70">
            {isLoadingDetail ? '강의실 정보를 불러오고 있습니다.' : classroomSubtitle || '강의실 정보를 확인하세요.'}
          </p>
        </header>

        <section className="rounded-3xl bg-white px-6 py-5 shadow-soft">
          {isLoadingTabs ? (
            <p className="text-sm text-ellieGray/70">탭을 불러오는 중입니다...</p>
          ) : tabs.length === 0 ? (
            <p className="text-sm text-ellieGray/70">탭 정보가 없습니다.</p>
          ) : (
            <nav className="sticky top-0 z-10 rounded-3xl bg-white/90 p-2 shadow-soft backdrop-blur">
              <ul className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                  const tabKey = tab.tab || tab.tab_key || tab.id || tab.key;
                  const tabLabel = tab.title || tab.label || tab.name || tab.tab;
                  const isActive = tabKey === activeTab;
                  return (
                    <li key={tabKey} className="min-w-[96px] flex-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab(tabKey)}
                        className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                          isActive
                            ? 'bg-[#ffd331] text-ellieGray shadow-soft'
                            : 'bg-transparent text-ellieGray/60 hover:bg-[#fff6d3]'
                        }`}
                      >
                        {tabLabel || tabKey}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
        </section>

        <section className="rounded-3xl bg-white/90 p-6 shadow-soft">
          {error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : isLoadingContent ? (
            <p className="text-sm text-ellieGray/70">콘텐츠를 불러오는 중입니다...</p>
          ) : tabContent.length === 0 ? (
            <p className="text-sm text-ellieGray/70">표시할 콘텐츠가 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-4">{tabContent.map((item) => renderContentBody(item))}</ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default ClassroomDetail;
