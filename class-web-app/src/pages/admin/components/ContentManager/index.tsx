import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';

import { useAdminClasses } from '../../data/AdminClassContext';
import {
  createMaterial,
  createNotice,
  createVideo,
  getMaterials,
  getNotices,
  getVideos,
  type MaterialPayload,
  type NoticePayload,
  type VideoPayload,
} from '../../../../lib/api';

const TAB_ITEMS = [
  { key: 'video' as const, label: '영상' },
  { key: 'notice' as const, label: '공지' },
  { key: 'material' as const, label: '자료' },
];

type TabKey = (typeof TAB_ITEMS)[number]['key'];

type VideoFormState = {
  code: string;
};

type NoticeFormState = {
  title: string;
  content: string;
};

type MaterialFormState = {
  title: string;
  content: string;
};

const createFallbackId = () => Number(new Date());

const sortByCreatedAtDesc = <T extends { createdAt?: string }>(list: T[]) =>
  [...list].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

const ContentManager = () => {
  const { classes } = useAdminClasses();
  const [activeTab, setActiveTab] = useState<TabKey>('video');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [videos, setVideos] = useState<VideoPayload[]>([]);
  const [notices, setNotices] = useState<NoticePayload[]>([]);
  const [materials, setMaterials] = useState<MaterialPayload[]>([]);
  const [videoForm, setVideoForm] = useState<VideoFormState>({ code: '' });
  const [noticeForm, setNoticeForm] = useState<NoticeFormState>({ title: '', content: '' });
  const [materialForm, setMaterialForm] = useState<MaterialFormState>({ title: '', content: '' });

  useEffect(() => {
    let mounted = true;

    const loadContent = async () => {
      try {
        const [videoList, noticeList, materialList] = await Promise.all([
          getVideos(),
          getNotices(),
          getMaterials(),
        ]);

        if (!mounted) {
          return;
        }

        setVideos(sortByCreatedAtDesc(videoList));
        setNotices(sortByCreatedAtDesc(noticeList));
        setMaterials(sortByCreatedAtDesc(materialList));
      } catch (error) {
        console.error('[ContentManager] 콘텐츠 정보를 불러오는 데 실패했습니다.', error);
      }
    };

    void loadContent();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (classes.length === 0) {
      setSelectedClassId(null);
      return;
    }

    if (selectedClassId === null || !classes.some((item) => item.id === selectedClassId)) {
      setSelectedClassId(classes[0]?.id ?? null);
    }
  }, [classes, selectedClassId]);

  const filteredVideos = useMemo(
    () =>
      selectedClassId == null
        ? []
        : videos.filter((video) => video.classId === selectedClassId),
    [selectedClassId, videos],
  );

  const filteredNotices = useMemo(
    () =>
      selectedClassId == null
        ? []
        : notices.filter((notice) => notice.classId === selectedClassId),
    [notices, selectedClassId],
  );

  const filteredMaterials = useMemo(
    () =>
      selectedClassId == null
        ? []
        : materials.filter((material) => material.classId === selectedClassId),
    [materials, selectedClassId],
  );

  const hasClasses = classes.length > 0;

  const resetVideoForm = () => setVideoForm({ code: '' });
  const resetNoticeForm = () => setNoticeForm({ title: '', content: '' });
  const resetMaterialForm = () => setMaterialForm({ title: '', content: '' });

  const handleVideoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasClasses || selectedClassId == null) {
      return;
    }

    const trimmedCode = videoForm.code.trim();
    if (!trimmedCode) {
      return;
    }

    try {
      const created = await createVideo({
        title: trimmedCode,
        url: trimmedCode,
        classId: selectedClassId,
      });
      setVideos((prev) => sortByCreatedAtDesc([created, ...prev]));
      resetVideoForm();
    } catch (error) {
      console.error('[ContentManager] 영상 저장 실패 – 임시 데이터로 대체합니다.', error);
      const fallback: VideoPayload = {
        id: createFallbackId(),
        title: trimmedCode,
        url: trimmedCode,
        description: null,
        classId: selectedClassId,
        createdAt: new Date().toISOString(),
      };
      setVideos((prev) => sortByCreatedAtDesc([fallback, ...prev]));
      resetVideoForm();
    }
  };

  const handleNoticeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasClasses || selectedClassId == null) {
      return;
    }

    const title = noticeForm.title.trim();
    const content = noticeForm.content.trim();

    if (!title || !content) {
      return;
    }

    try {
      const created = await createNotice({
        title,
        content,
        classId: selectedClassId,
        author: '관리자',
      });
      setNotices((prev) => sortByCreatedAtDesc([created, ...prev]));
      resetNoticeForm();
    } catch (error) {
      console.error('[ContentManager] 공지 저장 실패 – 임시 데이터로 대체합니다.', error);
      const fallback: NoticePayload = {
        id: createFallbackId(),
        title,
        content,
        author: '관리자',
        classId: selectedClassId,
        createdAt: new Date().toISOString(),
      };
      setNotices((prev) => sortByCreatedAtDesc([fallback, ...prev]));
      resetNoticeForm();
    }
  };

  const handleMaterialSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasClasses || selectedClassId == null) {
      return;
    }

    const title = materialForm.title.trim();
    const content = materialForm.content.trim();

    if (!title || !content) {
      return;
    }

    try {
      const created = await createMaterial({
        title,
        fileUrl: content,
        classId: selectedClassId,
      });
      setMaterials((prev) => sortByCreatedAtDesc([created, ...prev]));
      resetMaterialForm();
    } catch (error) {
      console.error('[ContentManager] 자료 저장 실패 – 임시 데이터로 대체합니다.', error);
      const fallback: MaterialPayload = {
        id: createFallbackId(),
        title,
        fileUrl: content,
        description: null,
        classId: selectedClassId,
        createdAt: new Date().toISOString(),
      };
      setMaterials((prev) => sortByCreatedAtDesc([fallback, ...prev]));
      resetMaterialForm();
    }
  };

  const handleDeleteVideo = (id: number) => {
    setVideos((prev) => prev.filter((video) => video.id !== id));
  };

  const handleDeleteNotice = (id: number) => {
    setNotices((prev) => prev.filter((notice) => notice.id !== id));
  };

  const handleDeleteMaterial = (id: number) => {
    setMaterials((prev) => prev.filter((material) => material.id !== id));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-md">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold text-[#404040]">콘텐츠 관리</h2>
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="classSelect">
              수업 선택
            </label>
            <select
              id="classSelect"
              className="rounded-2xl border border-[#e9dccf] bg-white px-4 py-2 text-sm font-semibold text-[#404040] focus:border-[#ffd331] focus:outline-none"
              value={selectedClassId ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedClassId(value === '' ? null : Number(value));
              }}
              disabled={!hasClasses}
            >
              {!hasClasses && (
                <option value="">
                  수업이 없습니다
                </option>
              )}
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-colors focus:outline-none ${
                activeTab === tab.key
                  ? 'bg-[#ffd331] text-[#404040] shadow-md'
                  : 'bg-[#f5eee9] text-[#7a6f68] hover:bg-[#ffd331]/80 hover:text-[#404040]'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'video' && (
        <section className="flex flex-col gap-6">
          <form className="rounded-3xl bg-white p-6 shadow-md" onSubmit={handleVideoSubmit}>
            <h3 className="mb-4 text-lg font-semibold text-[#404040]">비메오 코드 등록</h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="videoCode">
                비메오 코드
              </label>
              <input
                id="videoCode"
                type="text"
                className="flex-1 rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                placeholder="예: https://vimeo.com/... 또는 iframe 코드"
                value={videoForm.code}
                onChange={(event) => setVideoForm({ code: event.target.value })}
                disabled={!hasClasses}
              />
              <button
                type="submit"
                className="rounded-2xl bg-[#ffd331] px-6 py-2 text-sm font-semibold text-[#404040] shadow-md transition-colors hover:bg-[#e6bd2c]"
                disabled={!hasClasses}
              >
                저장
              </button>
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-[#404040]">업로드된 영상</h3>
            {filteredVideos.length === 0 ? (
              <p className="text-sm text-[#7a6f68]">표시할 콘텐츠가 없습니다.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredVideos.map((video) => (
                  <article key={video.id} className="flex flex-col gap-3 rounded-2xl bg-[#f9f5f1] p-4 shadow-sm">
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/5">
                      {video.url.trim().startsWith('<') ? (
                        <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: video.url }} />
                      ) : (
                        <iframe
                          title={video.title || '업로드된 영상'}
                          src={video.url}
                          className="h-full w-full border-0"
                          allow="fullscreen"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#404040]">{video.title || 'Vimeo'}</span>
                        <span className="text-xs text-[#7a6f68]">
                          {new Date(video.createdAt ?? Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="rounded-full bg-[#f5eee9] p-2 text-[#5c5c5c] transition-colors hover:bg-[#ffd331]/80"
                        onClick={() => handleDeleteVideo(video.id)}
                        aria-label="영상 삭제"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'notice' && (
        <section className="flex flex-col gap-6">
          <form className="rounded-3xl bg-white p-6 shadow-md" onSubmit={handleNoticeSubmit}>
            <h3 className="mb-4 text-lg font-semibold text-[#404040]">공지 등록</h3>
            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="noticeTitle">
                  제목
                </label>
                <input
                  id="noticeTitle"
                  type="text"
                  className="rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  value={noticeForm.title}
                  onChange={(event) => setNoticeForm((prev) => ({ ...prev, title: event.target.value }))}
                  disabled={!hasClasses}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="noticeContent">
                  내용
                </label>
                <textarea
                  id="noticeContent"
                  className="min-h-[120px] rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  value={noticeForm.content}
                  onChange={(event) => setNoticeForm((prev) => ({ ...prev, content: event.target.value }))}
                  disabled={!hasClasses}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="rounded-2xl bg-[#ffd331] px-6 py-2 text-sm font-semibold text-[#404040] shadow-md transition-colors hover:bg-[#e6bd2c]"
                disabled={!hasClasses}
              >
                업로드
              </button>
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-[#404040]">등록된 공지</h3>
            {filteredNotices.length === 0 ? (
              <p className="text-sm text-[#7a6f68]">표시할 콘텐츠가 없습니다.</p>
            ) : (
              <ul className="space-y-4">
                {filteredNotices.map((notice) => (
                  <li key={notice.id} className="rounded-2xl bg-[#f9f5f1] p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-[#404040]">{notice.title}</h4>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-[#5c5c5c]">{notice.content}</p>
                        <p className="mt-2 text-xs text-[#7a6f68]">
                          {new Date(notice.createdAt ?? Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-full bg-[#f5eee9] p-2 text-[#5c5c5c] transition-colors hover:bg-[#ffd331]/80"
                        onClick={() => handleDeleteNotice(notice.id)}
                        aria-label="공지 삭제"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {activeTab === 'material' && (
        <section className="flex flex-col gap-6">
          <form className="rounded-3xl bg-white p-6 shadow-md" onSubmit={handleMaterialSubmit}>
            <h3 className="mb-4 text-lg font-semibold text-[#404040]">자료 업로드</h3>
            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="materialTitle">
                  제목
                </label>
                <input
                  id="materialTitle"
                  type="text"
                  className="rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  value={materialForm.title}
                  onChange={(event) => setMaterialForm((prev) => ({ ...prev, title: event.target.value }))}
                  disabled={!hasClasses}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="materialContent">
                  내용
                </label>
                <textarea
                  id="materialContent"
                  className="min-h-[120px] rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  value={materialForm.content}
                  onChange={(event) => setMaterialForm((prev) => ({ ...prev, content: event.target.value }))}
                  disabled={!hasClasses}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="rounded-2xl bg-[#ffd331] px-6 py-2 text-sm font-semibold text-[#404040] shadow-md transition-colors hover:bg-[#e6bd2c]"
                disabled={!hasClasses}
              >
                업로드
              </button>
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-[#404040]">등록된 자료</h3>
            {filteredMaterials.length === 0 ? (
              <p className="text-sm text-[#7a6f68]">표시할 콘텐츠가 없습니다.</p>
            ) : (
              <ul className="space-y-4">
                {filteredMaterials.map((material) => (
                  <li key={material.id} className="rounded-2xl bg-[#f9f5f1] p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-[#404040]">{material.title}</h4>
                        <p className="mt-2 break-words text-sm text-[#5c5c5c]">{material.fileUrl}</p>
                        <p className="mt-2 text-xs text-[#7a6f68]">
                          {new Date(material.createdAt ?? Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-full bg-[#f5eee9] p-2 text-[#5c5c5c] transition-colors hover:bg-[#ffd331]/80"
                        onClick={() => handleDeleteMaterial(material.id)}
                        aria-label="자료 삭제"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default ContentManager;
