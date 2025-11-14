import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { GripVertical, Trash2 } from 'lucide-react';

import { useAdminClasses } from '../../data/AdminClassContext';
import { type MaterialPayload, type NoticePayload, type VideoPayload } from '../../../../lib/api';

const TAB_ITEMS = [
  { key: 'video' as const, label: '영상' },
  { key: 'notice' as const, label: '공지' },
  { key: 'material' as const, label: '자료' },
];

type TabKey = (typeof TAB_ITEMS)[number]['key'];

type VideoFormState = {
  title: string;
  url: string;
  description: string;
};

type NoticeFormState = {
  title: string;
  content: string;
};

type MaterialFormState = {
  title: string;
  description: string;
  file: File | null;
  linkUrl: string;
  uploadType: 'file' | 'link';
};

const sortByCreatedAtDesc = <T extends { createdAt?: string }>(list: T[]) =>
  [...list].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

const sortVideosForDisplay = (list: VideoPayload[]) =>
  [...list].sort((a, b) => {
    const orderA = typeof a.displayOrder === 'number' ? a.displayOrder : Number.MAX_SAFE_INTEGER;
    const orderB = typeof b.displayOrder === 'number' ? b.displayOrder : Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

const reorderVideoDisplayOrder = (
  list: VideoPayload[],
  classId: number,
  sourceId: number,
  targetId: number,
) => {
  const classVideos = sortVideosForDisplay(list.filter((item) => item.classId === classId));
  const sourceIndex = classVideos.findIndex((item) => item.id === sourceId);
  const targetIndex = classVideos.findIndex((item) => item.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return list;
  }

  const updatedClassVideos = [...classVideos];
  const [moved] = updatedClassVideos.splice(sourceIndex, 1);
  updatedClassVideos.splice(targetIndex, 0, moved);

  const orderMap = new Map<number, number>();
  updatedClassVideos.forEach((video, index) => {
    orderMap.set(video.id, index);
  });

  return list.map((video) =>
    video.classId === classId && orderMap.has(video.id)
      ? { ...video, displayOrder: orderMap.get(video.id)! }
      : video,
  );
};

const ContentManager = () => {
  const { classes } = useAdminClasses();
  const [activeTab, setActiveTab] = useState<TabKey>('video');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [videos, setVideos] = useState<VideoPayload[]>([]);
  const [notices, setNotices] = useState<NoticePayload[]>([]);
  const [materials, setMaterials] = useState<MaterialPayload[]>([]);
  const [videoForm, setVideoForm] = useState<VideoFormState>({ title: '', url: '', description: '' });
  const [noticeForm, setNoticeForm] = useState<NoticeFormState>({ title: '', content: '' });
  const [materialForm, setMaterialForm] = useState<MaterialFormState>({
    title: '',
    description: '',
    file: null,
    linkUrl: '',
    uploadType: 'file',
  });
  const [draggedVideoId, setDraggedVideoId] = useState<number | null>(null);
  const [isReorderingVideos, setIsReorderingVideos] = useState(false);

  useEffect(() => {
    setVideos([]);
    setNotices([]);
    setMaterials([]);

    // const loadContent = async () => {
    //   const [videoList, noticeList, materialList] = await Promise.all([
    //     getVideos(),
    //     getNotices(),
    //     getMaterials(),
    //   ]);
    //   setVideos(videoList);
    //   setNotices(sortByCreatedAtDesc(noticeList));
    //   setMaterials(sortByCreatedAtDesc(materialList));
    // };
    // void loadContent();
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

  const filteredVideos = useMemo(() => {
    if (selectedClassId == null) {
      return [] as VideoPayload[];
    }

    return sortVideosForDisplay(videos.filter((video) => video.classId === selectedClassId));
  }, [selectedClassId, videos]);

  const filteredNotices = useMemo(() => {
    if (selectedClassId == null) {
      return [] as NoticePayload[];
    }

    return sortByCreatedAtDesc(notices.filter((notice) => notice.classId === selectedClassId));
  }, [notices, selectedClassId]);

  const filteredMaterials = useMemo(() => {
    if (selectedClassId == null) {
      return [] as MaterialPayload[];
    }

    return sortByCreatedAtDesc(materials.filter((material) => material.classId === selectedClassId));
  }, [materials, selectedClassId]);

  const hasClasses = classes.length > 0;

  const resetVideoForm = () => setVideoForm({ title: '', url: '', description: '' });
  const resetNoticeForm = () => setNoticeForm({ title: '', content: '' });
  const resetMaterialForm = () =>
    setMaterialForm({ title: '', description: '', file: null, linkUrl: '', uploadType: 'file' });

  const handleVideoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasClasses || selectedClassId == null) {
      return;
    }

    // 콘텐츠 업로드 기능 비활성화
  };

  const handleNoticeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasClasses || selectedClassId == null) {
      return;
    }

    // 콘텐츠 업로드 기능 비활성화
  };

  const handleMaterialSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasClasses || selectedClassId == null) {
      return;
    }

    // 콘텐츠 업로드 기능 비활성화
  };

  const handleDeleteVideo = async (id: number) => {
    void id;
    // 콘텐츠 삭제 기능 비활성화
  };

  const handleDeleteNotice = async (id: number) => {
    void id;
    // 콘텐츠 삭제 기능 비활성화
  };

  const handleDeleteMaterial = async (id: number) => {
    void id;
    // 콘텐츠 삭제 기능 비활성화
  };

  const handleVideoDrop = async (targetId: number) => {
    void targetId;
    setIsReorderingVideos(false);
    setDraggedVideoId(null);

    // 영상 순서 저장 기능 비활성화
  };

  const handleVideoDragStart = (id: number) => () => {
    setDraggedVideoId(id);
  };

  const handleVideoDragEnd = () => {
    setDraggedVideoId(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setMaterialForm((prev) => ({
      ...prev,
      file,
      uploadType: 'file',
      linkUrl: '',
    }));
  };

  const handleUploadTypeChange = (type: 'file' | 'link') => {
    setMaterialForm((prev) => ({
      ...prev,
      uploadType: type,
      file: type === 'file' ? prev.file : null,
      linkUrl: type === 'link' ? prev.linkUrl : '',
    }));
  };

  const handleLinkChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setMaterialForm((prev) => ({
      ...prev,
      linkUrl: value,
      uploadType: 'link',
      file: null,
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-md">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold text-[#404040]">콘텐츠 관리</h2>
          <div className="flex flex-col gap-2 text-sm text-[#7a6f68] md:flex-row md:items-center md:gap-3">
            <label className="font-semibold text-[#5c5c5c]" htmlFor="classSelect">
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
                <option value="">수업이 없습니다</option>
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
            <h3 className="mb-4 text-lg font-semibold text-[#404040]">영상 등록</h3>
            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="videoTitle">
                  영상 제목
                </label>
                <input
                  id="videoTitle"
                  type="text"
                  className="rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  placeholder="예: 1주차 오리엔테이션"
                  value={videoForm.title}
                  onChange={(event) => setVideoForm((prev) => ({ ...prev, title: event.target.value }))}
                  disabled={!hasClasses}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="videoUrl">
                  링크 또는 임베드 코드
                </label>
                <textarea
                  id="videoUrl"
                  className="min-h-[80px] rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  placeholder="https://vimeo.com/... 혹은 &lt;iframe&gt; 코드"
                  value={videoForm.url}
                  onChange={(event) => setVideoForm((prev) => ({ ...prev, url: event.target.value }))}
                  disabled={!hasClasses}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="videoDescription">
                  설명 (선택)
                </label>
                <textarea
                  id="videoDescription"
                  className="min-h-[80px] rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  placeholder="영상에 대한 간단한 설명을 남겨주세요."
                  value={videoForm.description}
                  onChange={(event) => setVideoForm((prev) => ({ ...prev, description: event.target.value }))}
                  disabled={!hasClasses}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="rounded-2xl bg-[#ffd331] px-6 py-2 text-sm font-semibold text-[#404040] shadow-md transition-colors hover:bg-[#e6bd2c] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!hasClasses}
              >
                저장
              </button>
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-[#404040]">업로드된 영상</h3>
              {isReorderingVideos && (
                <span className="text-xs text-[#7a6f68]">순서를 저장하는 중입니다...</span>
              )}
            </div>
            {filteredVideos.length === 0 ? (
              <p className="text-sm text-[#7a6f68]">표시할 콘텐츠가 없습니다.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {filteredVideos.map((video) => (
                  <article
                    key={video.id}
                    className={`flex flex-col gap-3 rounded-2xl bg-[#f9f5f1] p-4 shadow-sm transition ring-offset-2 ${
                      draggedVideoId === video.id ? 'ring-2 ring-[#ffd331]' : 'hover:ring-1 hover:ring-[#ffd331]'
                    }`}
                    draggable
                    onDragStart={handleVideoDragStart(video.id)}
                    onDragEnd={handleVideoDragEnd}
                    onDragOver={(event: DragEvent<HTMLElement>) => {
                      event.preventDefault();
                    }}
                    onDrop={(event: DragEvent<HTMLElement>) => {
                      event.preventDefault();
                      handleVideoDrop(video.id).catch((error) => {
                        console.error('[ContentManager] 드래그 중 오류가 발생했습니다.', error);
                      });
                    }}
                  >
                    <div className="flex items-center justify-between text-[#7a6f68]">
                      <span className="flex items-center gap-2 text-xs">
                        <GripVertical className="h-4 w-4" aria-hidden="true" />
                        드래그로 순서 변경
                      </span>
                      <span className="text-xs font-semibold">
                        #{typeof video.displayOrder === 'number' ? video.displayOrder + 1 : '-'}
                      </span>
                    </div>
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
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-[#404040]">{video.title || '영상'}</span>
                        {video.description && (
                          <p className="text-xs text-[#5c5c5c]">{video.description}</p>
                        )}
                        <span className="text-xs text-[#7a6f68]">
                          {new Date(video.createdAt ?? Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="rounded-full bg-[#f5eee9] p-2 text-[#5c5c5c] transition-colors hover:bg-[#ffd331]/80"
                        onClick={() => {
                          handleDeleteVideo(video.id).catch((error) => {
                            console.error('[ContentManager] 영상 삭제 실패', error);
                          });
                        }}
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
                className="rounded-2xl bg-[#ffd331] px-6 py-2 text-sm font-semibold text-[#404040] shadow-md transition-colors hover:bg-[#e6bd2c] disabled:cursor-not-allowed disabled:opacity-60"
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
                        onClick={() => {
                          handleDeleteNotice(notice.id).catch((error) => {
                            console.error('[ContentManager] 공지 삭제 실패', error);
                          });
                        }}
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
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="materialDescription">
                  설명
                </label>
                <textarea
                  id="materialDescription"
                  className="min-h-[120px] rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  value={materialForm.description}
                  onChange={(event) => setMaterialForm((prev) => ({ ...prev, description: event.target.value }))}
                  disabled={!hasClasses}
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#5c5c5c]">업로드 방식</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors ${
                      materialForm.uploadType === 'file'
                        ? 'border-[#ffd331] bg-[#ffd331] text-[#404040] shadow-sm'
                        : 'border-[#e9dccf] bg-white text-[#5c5c5c] hover:border-[#ffd331] hover:bg-[#fff6d6]'
                    }`}
                    onClick={() => handleUploadTypeChange('file')}
                    disabled={!hasClasses}
                  >
                    파일 업로드
                  </button>
                  <button
                    type="button"
                    className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors ${
                      materialForm.uploadType === 'link'
                        ? 'border-[#ffd331] bg-[#ffd331] text-[#404040] shadow-sm'
                        : 'border-[#e9dccf] bg-white text-[#5c5c5c] hover:border-[#ffd331] hover:bg-[#fff6d6]'
                    }`}
                    onClick={() => handleUploadTypeChange('link')}
                    disabled={!hasClasses}
                  >
                    링크 업로드
                  </button>
                </div>
                <p className="text-xs text-[#7a6f68]">
                  파일을 직접 업로드하거나 외부 링크를 첨부하여 학습 자료를 공유할 수 있습니다.
                </p>
              </div>
              {materialForm.uploadType === 'file' ? (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="materialFile">
                    파일 (PDF, 이미지 등)
                  </label>
                  <input
                    id="materialFile"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.heic,.bmp,.ppt,.pptx,.doc,.docx,.zip"
                    className="rounded-2xl border border-dashed border-[#e9dccf] px-4 py-3 text-sm focus:border-[#ffd331] focus:outline-none"
                    onChange={handleFileChange}
                    disabled={!hasClasses}
                  />
                  {materialForm.file && (
                    <p className="text-xs text-[#7a6f68]">선택된 파일: {materialForm.file.name}</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="materialLink">
                    링크 URL
                  </label>
                  <input
                    id="materialLink"
                    type="url"
                    placeholder="https://example.com/material"
                    className="rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                    value={materialForm.linkUrl}
                    onChange={handleLinkChange}
                    disabled={!hasClasses}
                  />
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="rounded-2xl bg-[#ffd331] px-6 py-2 text-sm font-semibold text-[#404040] shadow-md transition-colors hover:bg-[#e6bd2c] disabled:cursor-not-allowed disabled:opacity-60"
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
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-[#404040]">{material.title}</h4>
                        {material.description && (
                          <p className="mt-2 whitespace-pre-wrap text-sm text-[#5c5c5c]">{material.description}</p>
                        )}
                        <div className="mt-3 flex flex-col gap-2 text-xs text-[#7a6f68] sm:flex-row sm:items-center sm:gap-4">
                          <span>
                            업로드일: {new Date(material.createdAt ?? Date.now()).toLocaleDateString()}
                          </span>
                          {material.fileUrl && (
                            <a
                              href={material.fileUrl}
                              download={material.fileName ?? undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-[#404040] underline-offset-2 hover:underline"
                            >
                              {material.fileName ?? (material.mimeType === 'link' ? '링크 열기' : '파일 열기')}
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="self-start rounded-full bg-[#f5eee9] p-2 text-[#5c5c5c] transition-colors hover:bg-[#ffd331]/80"
                        onClick={() => {
                          handleDeleteMaterial(material.id).catch((error) => {
                            console.error('[ContentManager] 자료 삭제 실패', error);
                          });
                        }}
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
