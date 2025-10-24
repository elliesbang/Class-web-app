import { DragEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';

import AdminModal from '../../components/admin/AdminModal';
import Toast, { ToastVariant } from '../../components/admin/Toast';
import type { ClassInfo, NoticePayload } from '../../lib/api';
import { createMaterial, createNotice, createVideo, getClasses, getMaterials, getNotices, getVideos } from '../../lib/api';

type VideoContent = {
  id: number;
  type: 'video';
  title: string;
  classId: number;
  className: string;
  url: string;
  description?: string;
  date: string;
  order: number;
};

type FileContent = {
  id: number;
  type: 'file';
  title: string;
  classId: number;
  className: string;
  fileUrl: string;
  description?: string;
  date: string;
};

type NoticeContent = {
  id: number;
  type: 'notice';
  title: string;
  classId: number;
  className: string;
  content: string;
  author: string;
  date: string;
  createdAt: string;
};

type TabKey = 'video' | 'file' | 'notice';

type ContentType = 'video' | 'file' | 'notice';

type DeleteTarget = {
  id: number;
  type: ContentType;
  title: string;
};

type ToastState = {
  message: string;
  variant?: ToastVariant;
};

type StoredVideoOrder = {
  id: number;
  order: number;
};

const VIDEO_ORDER_STORAGE_KEY = 'admin-video-order';

const formatDate = (value?: string) => {
  if (!value) {
    return new Date().toISOString().split('T')[0];
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return parsed.toISOString().split('T')[0];
};

const assignSequentialOrder = (list: VideoContent[]): VideoContent[] =>
  list.map((video, index) => ({ ...video, order: index + 1 }));

const persistVideoOrder = (list: VideoContent[]) => {
  if (typeof window === 'undefined') return;

  const payload = list.map((video) => ({ id: video.id, order: video.order }));
  try {
    window.localStorage.setItem(VIDEO_ORDER_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to persist video order', error);
  }
};

const hydrateVideosWithStoredOrder = (baseVideos: VideoContent[]): VideoContent[] => {
  const orderedBase = assignSequentialOrder(baseVideos);

  if (typeof window === 'undefined') {
    return orderedBase;
  }

  const storedOrderRaw = window.localStorage.getItem(VIDEO_ORDER_STORAGE_KEY);
  if (!storedOrderRaw) {
    return orderedBase;
  }

  try {
    const parsed: StoredVideoOrder[] = JSON.parse(storedOrderRaw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return orderedBase;
    }

    const orderMap = new Map<number, number>();
    parsed.forEach((item) => {
      if (typeof item?.id === 'number' && typeof item?.order === 'number') {
        orderMap.set(item.id, item.order);
      }
    });

    if (orderMap.size === 0) {
      return orderedBase;
    }

    const sortedByStoredOrder = [...orderedBase].sort((a, b) => {
      const orderA = orderMap.get(a.id);
      const orderB = orderMap.get(b.id);

      if (orderA === undefined && orderB === undefined) {
        return a.order - b.order;
      }

      if (orderA === undefined) return 1;
      if (orderB === undefined) return -1;
      if (orderA === orderB) return a.order - b.order;
      return orderA - orderB;
    });

    return assignSequentialOrder(sortedByStoredOrder);
  } catch (error) {
    console.error('Failed to parse stored video order', error);
    return orderedBase;
  }
};

const toNoticeContent = (notice: NoticePayload, className: string): NoticeContent => ({
  id: notice.id,
  type: 'notice',
  title: notice.title,
  classId: notice.classId,
  className,
  content: notice.content,
  author: notice.author ?? '관리자',
  date: formatDate(notice.createdAt),
  createdAt: notice.createdAt,
});

const sortNotices = (list: NoticeContent[]) =>
  [...list].sort((a, b) => {
    const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (timeDiff !== 0) {
      return timeDiff;
    }
    return b.id - a.id;
  });

const AdminContentManagement = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('video');
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [files, setFiles] = useState<FileContent[]>([]);
  const [notices, setNotices] = useState<NoticeContent[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [draggedVideoId, setDraggedVideoId] = useState<number | null>(null);

  const [videoForm, setVideoForm] = useState({
    title: '',
    classId: null as number | null,
    description: '',
    url: '',
  });

  const [fileForm, setFileForm] = useState({
    title: '',
    classId: null as number | null,
    description: '',
    fileName: '',
  });

  const [noticeForm, setNoticeForm] = useState({
    title: '',
    classId: null as number | null,
    content: '',
  });

  const [noticeModal, setNoticeModal] = useState<NoticeContent | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      let encounteredError = false;

      let resolvedClasses: ClassInfo[] = [];
      try {
        const fetchedClasses = await getClasses();
        resolvedClasses = fetchedClasses;
      } catch (error) {
        console.error('Failed to load admin classes', error);
        encounteredError = true;
        resolvedClasses = [];
      }

      setClasses(resolvedClasses);

      const classMap = new Map(resolvedClasses.map((item) => [item.id, item.name]));

      const [videoList, materialList, noticeList] = await Promise.all([
        getVideos().catch((error) => {
          console.error('Failed to load admin videos', error);
          encounteredError = true;
          return [];
        }),
        getMaterials().catch((error) => {
          console.error('Failed to load admin materials', error);
          encounteredError = true;
          return [];
        }),
        getNotices().catch((error) => {
          console.error('Failed to load admin notices', error);
          encounteredError = true;
          return [];
        }),
      ]);

        const mappedVideos: VideoContent[] = videoList.map((video) => ({
          id: video.id,
          type: 'video',
          title: video.title,
          classId: video.classId,
          className: classMap.get(video.classId) ?? '미지정',
          url: video.url,
          description: video.description ?? undefined,
          date: formatDate(video.createdAt),
          order: 0,
        }));

        const mappedFiles: FileContent[] = materialList.map((material) => ({
          id: material.id,
          type: 'file',
          title: material.title,
          classId: material.classId,
          className: classMap.get(material.classId) ?? '미지정',
          fileUrl: material.fileUrl,
          description: material.description ?? undefined,
          date: formatDate(material.createdAt),
        }));

        const mappedNotices: NoticeContent[] = noticeList.map((notice) =>
          toNoticeContent(notice, classMap.get(notice.classId) ?? '미지정'),
        );

        setVideos(hydrateVideosWithStoredOrder(mappedVideos));
        setFiles(mappedFiles);
        setNotices(sortNotices(mappedNotices));
      if (encounteredError) {
        setToast({ message: '콘텐츠 정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.', variant: 'error' });
      }
    };

    void loadInitialData();
  }, []);

  const defaultClassId = classes[0]?.id ?? null;

  useEffect(() => {
    if (defaultClassId === null) {
      return;
    }

    setVideoForm((prev) => ({ ...prev, classId: prev.classId ?? defaultClassId }));
    setFileForm((prev) => ({ ...prev, classId: prev.classId ?? defaultClassId }));
    setNoticeForm((prev) => ({ ...prev, classId: prev.classId ?? defaultClassId }));
  }, [defaultClassId]);

  const classNameById = useMemo(() => new Map(classes.map((item) => [item.id, item.name])), [classes]);

  const getClassName = useCallback((classId: number) => classNameById.get(classId) ?? '미지정', [classNameById]);

  const filteredVideos = useMemo(() => [...videos].sort((a, b) => a.order - b.order), [videos]);

  const filteredFiles = useMemo(() => [...files], [files]);

  const filteredNotices = useMemo(() => [...notices], [notices]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
  };

  const resetVideoForm = useCallback(() => {
    setVideoForm({ title: '', classId: defaultClassId, description: '', url: '' });
  }, [defaultClassId]);

  const resetFileForm = useCallback(() => {
    setFileForm({ title: '', classId: defaultClassId, description: '', fileName: '' });
    setFileInputKey((prev) => prev + 1);
  }, [defaultClassId]);

  const resetNoticeForm = useCallback(() => {
    setNoticeForm({ title: '', classId: defaultClassId, content: '' });
  }, [defaultClassId]);

  const handleVideoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!videoForm.title || !videoForm.url || videoForm.classId === null) {
      setToast({ message: '영상 제목, URL, 수업을 모두 입력해주세요.', variant: 'error' });
      return;
    }

    try {
      const createdVideo = await createVideo({
        title: videoForm.title,
        url: videoForm.url,
        description: videoForm.description || undefined,
        classId: videoForm.classId,
      });

      const className = getClassName(createdVideo.classId);
      const newVideo: VideoContent = {
        id: createdVideo.id,
        type: 'video',
        title: createdVideo.title,
        classId: createdVideo.classId,
        className,
        url: createdVideo.url,
        description: createdVideo.description ?? undefined,
        date: new Date(createdVideo.createdAt).toISOString().split('T')[0],
        order: 0,
      };

      setVideos((prev) => {
        const updated = assignSequentialOrder([newVideo, ...prev]);
        persistVideoOrder(updated);
        return updated;
      });
      setToast({ message: `선택한 클래스(${className})에 업로드되었습니다.`, variant: 'success' });
      resetVideoForm();
    } catch (error) {
      console.error('Failed to upload video', error);
      setToast({
        message: error instanceof Error ? error.message : '영상 업로드 중 오류가 발생했습니다.',
        variant: 'error',
      });
    }
  };

  const handleFileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fileForm.title || !fileForm.fileName || fileForm.classId === null) {
      setToast({ message: '자료 제목, 파일명, 수업을 모두 입력해주세요.', variant: 'error' });
      return;
    }

    const fileUrl = `/uploads/${fileForm.fileName}`;

    try {
      const createdMaterial = await createMaterial({
        title: fileForm.title,
        fileUrl,
        description: fileForm.description || undefined,
        classId: fileForm.classId,
      });

      const className = getClassName(createdMaterial.classId);
      const newFile: FileContent = {
        id: createdMaterial.id,
        type: 'file',
        title: createdMaterial.title,
        classId: createdMaterial.classId,
        className,
        fileUrl: createdMaterial.fileUrl,
        description: createdMaterial.description ?? undefined,
        date: new Date(createdMaterial.createdAt).toISOString().split('T')[0],
      };

      setFiles((prev) => [newFile, ...prev]);
      setToast({ message: `선택한 클래스(${className})에 업로드되었습니다.`, variant: 'success' });
      resetFileForm();
    } catch (error) {
      console.error('Failed to upload material', error);
      const className = fileForm.classId !== null ? getClassName(fileForm.classId) : '선택한 클래스';
      const fallbackFile: FileContent = {
        id: Date.now(),
        type: 'file',
        title: fileForm.title,
        classId: fileForm.classId ?? 0,
        className,
        fileUrl,
        description: fileForm.description || undefined,
        date: new Date().toISOString().split('T')[0],
      };
      setFiles((prev) => [fallbackFile, ...prev]);
      setToast({
        message: '네트워크 오류로 임시 저장되었습니다. 연결 상태를 확인해주세요.',
        variant: 'info',
      });
      resetFileForm();
    }
  };

  const handleNoticeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!noticeForm.title || !noticeForm.content || noticeForm.classId === null) {
      setToast({ message: '공지 제목, 내용, 수업을 모두 입력해주세요.', variant: 'error' });
      return;
    }

    try {
      const createdNotice = await createNotice({
        title: noticeForm.title,
        content: noticeForm.content,
        classId: noticeForm.classId,
        author: '관리자',
      });

      const className = getClassName(createdNotice.classId);
      const refreshedNotices = await getNotices({ classId: createdNotice.classId });
      const mappedNotices = refreshedNotices.map((notice) =>
        toNoticeContent(notice, getClassName(notice.classId)),
      );

      setNotices((prev) => {
        const otherNotices = prev.filter((notice) => notice.classId !== createdNotice.classId);
        return sortNotices([...mappedNotices, ...otherNotices]);
      });
      setToast({ message: `선택한 클래스(${className})에 업로드되었습니다.`, variant: 'success' });
      resetNoticeForm();
    } catch (error) {
      console.error('Failed to upload notice', error);
      if (noticeForm.classId !== null) {
        const className = getClassName(noticeForm.classId);
        const fallbackNotice: NoticeContent = {
          id: Date.now(),
          type: 'notice',
          title: noticeForm.title,
          classId: noticeForm.classId,
          className,
          content: noticeForm.content,
          author: '관리자',
          date: formatDate(),
          createdAt: new Date().toISOString(),
        };

        setNotices((prev) => sortNotices([fallbackNotice, ...prev]));
        setToast({ message: `네트워크 오류로 임시 등록되었습니다. (${className})`, variant: 'info' });
        resetNoticeForm();
        return;
      }

      setToast({
        message: error instanceof Error ? error.message : '공지 업로드 중 오류가 발생했습니다.',
        variant: 'error',
      });
    }
  };

  const handleDeleteRequest = (type: ContentType, id: number, title: string) => {
    setDeleteTarget({ type, id, title });
  };

  const handleCloseDeleteModal = () => {
    setDeleteTarget(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'video') {
      setVideos((prev) => {
        const filtered = prev.filter((video) => video.id !== deleteTarget.id);
        const updated = assignSequentialOrder(filtered);
        persistVideoOrder(updated);
        return updated;
      });
    }

    if (deleteTarget.type === 'file') {
      setFiles((prev) => prev.filter((file) => file.id !== deleteTarget.id));
    }

    if (deleteTarget.type === 'notice') {
      setNotices((prev) => prev.filter((notice) => notice.id !== deleteTarget.id));
      setNoticeModal((prev) => (prev && prev.id === deleteTarget.id ? null : prev));
    }

    setToast({ message: '삭제되었습니다.', variant: 'success' });
    setDeleteTarget(null);
  };

  const handleToastClose = () => setToast(null);

  const reorderVideos = (draggedId: number, targetId: number) => {
    let updatedList: VideoContent[] | null = null;

    setVideos((prev) => {
      const currentIndex = prev.findIndex((video) => video.id === draggedId);
      const targetIndex = prev.findIndex((video) => video.id === targetId);

      if (currentIndex === -1 || targetIndex === -1 || currentIndex === targetIndex) {
        return prev;
      }

      const reordered = [...prev];
      const [movedItem] = reordered.splice(currentIndex, 1);
      reordered.splice(targetIndex, 0, movedItem);

      const sequential = assignSequentialOrder(reordered);
      updatedList = sequential;
      return sequential;
    });

    if (updatedList) {
      persistVideoOrder(updatedList);
      setToast({ message: '영상 순서가 변경되었습니다.', variant: 'success' });
    }
  };

  const handleVideoDragStart = (event: DragEvent<HTMLElement>, videoId: number) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', videoId.toString());
    setDraggedVideoId(videoId);
  };

  const handleVideoDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleVideoDrop = (event: DragEvent<HTMLElement>, targetId: number) => {
    event.preventDefault();
    const draggedIdRaw = event.dataTransfer.getData('text/plain');
    const draggedId = draggedIdRaw ? Number(draggedIdRaw) : draggedVideoId;

    if (!draggedId) {
      setDraggedVideoId(null);
      return;
    }

    reorderVideos(draggedId, targetId);
    setDraggedVideoId(null);
  };

  const handleVideoDragEnd = () => {
    setDraggedVideoId(null);
  };

  const contentTypeLabel: Record<ContentType, string> = {
    video: '영상',
    file: '자료',
    notice: '공지',
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 text-[#404040]">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">콘텐츠 관리</h1>
          <p className="text-sm text-gray-500">
            수업별 영상, 자료, 공지를 한 곳에서 관리하세요.
          </p>
        </div>

        <div className="rounded-3xl bg-white/80 p-4 shadow-md">
          {isMobile ? (
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold" htmlFor="tabSelect">
                관리 항목 선택
              </label>
              <select
                id="tabSelect"
                className="rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                value={activeTab}
                onChange={(event) => handleTabChange(event.target.value as TabKey)}
              >
                <option value="video">🎥 영상 관리</option>
                <option value="file">📚 자료 관리</option>
                <option value="notice">📢 공지 관리</option>
              </select>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'video', label: '🎥 영상 관리' },
                { key: 'file', label: '📚 자료 관리' },
                { key: 'notice', label: '📢 공지 관리' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`rounded-2xl px-5 py-2 text-sm font-semibold transition-colors ${
                    activeTab === tab.key
                      ? 'bg-[#ffd331] text-[#404040] shadow-md'
                      : 'bg-[#f5eee9] text-[#5c5c5c] hover:bg-[#ffd331]/80'
                  }`}
                  onClick={() => handleTabChange(tab.key as TabKey)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeTab === 'video' && (
        <section className="flex flex-col gap-6">
          <form
            className="grid gap-4 rounded-3xl bg-white p-6 shadow-md"
            onSubmit={handleVideoSubmit}
          >
            <h2 className="text-xl font-semibold">영상 관리</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" htmlFor="videoTitle">
                  제목
                </label>
                <input
                  id="videoTitle"
                  type="text"
                  className="rounded-2xl border border-[#e9dccf] px-4 py-2 focus:border-[#ffd331] focus:outline-none"
                  value={videoForm.title}
                  onChange={(event) => setVideoForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="영상 제목을 입력하세요"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" htmlFor="videoCategory">
                  수업 카테고리
                </label>
                <select
                  id="videoCategory"
                  className="rounded-2xl border border-[#e9dccf] px-4 py-2 focus:border-[#ffd331] focus:outline-none"
                  value={videoForm.classId !== null ? String(videoForm.classId) : ''}
                  onChange={(event) => {
                    const { value } = event.target;
                    setVideoForm((prev) => ({ ...prev, classId: value === '' ? null : Number(value) }));
                  }}
                  disabled={classes.length === 0}
                  required
                >
                  <option value="" disabled>
                    수업을 선택하세요
                  </option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" htmlFor="videoDescription">
                  설명 (선택)
                </label>
                <textarea
                  id="videoDescription"
                  className="min-h-[96px] rounded-2xl border border-[#e9dccf] px-4 py-2 focus:border-[#ffd331] focus:outline-none"
                  value={videoForm.description}
                  onChange={(event) => setVideoForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="영상에 대한 간단한 설명을 입력하세요"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" htmlFor="videoUrl">
                  영상 URL 또는 임베드 코드
                </label>
                <textarea
                  id="videoUrl"
                  className="min-h-[96px] rounded-2xl border border-[#e9dccf] px-4 py-2 font-mono text-xs focus:border-[#ffd331] focus:outline-none"
                  value={videoForm.url}
                  onChange={(event) => setVideoForm((prev) => ({ ...prev, url: event.target.value }))}
                  placeholder="동영상 URL 혹은 iframe 코드를 입력하세요"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-2xl bg-[#ffd331] px-6 py-2 font-semibold text-[#404040] shadow-md transition-colors hover:bg-[#e6bd2c]"
              >
                등록
              </button>
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold">영상 리스트</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filteredVideos.map((video) => (
                <article
                  key={video.id}
                  className={`group flex cursor-grab flex-col overflow-hidden rounded-lg bg-[#f9f9f9] shadow-sm transition-transform transition-shadow duration-200 ease-out hover:scale-[1.05] hover:shadow-lg ${
                    draggedVideoId === video.id ? 'cursor-grabbing ring-2 ring-[#ffd331]' : ''
                  }`}
                  draggable
                  onDragStart={(event) => handleVideoDragStart(event, video.id)}
                  onDragOver={handleVideoDragOver}
                  onDrop={(event) => handleVideoDrop(event, video.id)}
                  onDragEnd={handleVideoDragEnd}
                  aria-grabbed={draggedVideoId === video.id}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-black/5 [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:rounded-md [&_iframe]:border-0 [&_iframe]:pointer-events-none">
                    {video.url.trim().startsWith('<') ? (
                      <div dangerouslySetInnerHTML={{ __html: video.url }} />
                    ) : (
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-full w-full items-center justify-center bg-white text-sm font-semibold text-[#404040] underline"
                      >
                        영상 열기
                      </a>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-3 px-4 pb-4 pt-3">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-[#404040]">{video.title}</h4>
                      <p className="text-xs text-gray-500">{video.className}</p>
                      <p className="text-xs text-gray-500">등록일 {video.date}</p>
                    </div>
                    <button
                      type="button"
                      className="mt-1 rounded-full bg-[#f5eee9] p-2 text-[#5c5c5c] transition-colors hover:bg-[#ffd331]/80"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteRequest('video', video.id, video.title);
                      }}
                      onMouseDown={(event) => event.stopPropagation()}
                      onTouchStart={(event) => event.stopPropagation()}
                      aria-label={`${video.title} 삭제`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'file' && (
        <section className="flex flex-col gap-6">
          <form
            className="grid gap-4 rounded-3xl bg-white p-6 shadow-md"
            onSubmit={handleFileSubmit}
          >
            <h2 className="text-xl font-semibold">자료 관리</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" htmlFor="fileTitle">
                  제목
                </label>
                <input
                  id="fileTitle"
                  type="text"
                  className="rounded-2xl border border-[#e9dccf] px-4 py-2 focus:border-[#ffd331] focus:outline-none"
                  value={fileForm.title}
                  onChange={(event) => setFileForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="자료 제목을 입력하세요"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" htmlFor="fileCategory">
                  수업 카테고리
                </label>
                <select
                  id="fileCategory"
                  className="rounded-2xl border border-[#e9dccf] px-4 py-2 focus:border-[#ffd331] focus:outline-none"
                  value={fileForm.classId !== null ? String(fileForm.classId) : ''}
                  onChange={(event) => {
                    const { value } = event.target;
                    setFileForm((prev) => ({ ...prev, classId: value === '' ? null : Number(value) }));
                  }}
                  disabled={classes.length === 0}
                  required
                >
                  <option value="" disabled>
                    수업을 선택하세요
                  </option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" htmlFor="fileDescription">
                  설명 (선택)
                </label>
                <textarea
                  id="fileDescription"
                  className="min-h-[96px] rounded-2xl border border-[#e9dccf] px-4 py-2 focus:border-[#ffd331] focus:outline-none"
                  value={fileForm.description}
                  onChange={(event) => setFileForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="자료에 대한 설명을 입력하세요"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" htmlFor="fileUpload">
                  파일 업로드
                </label>
                <input
                  key={fileInputKey}
                  id="fileUpload"
                  type="file"
                  className="w-full cursor-pointer rounded-2xl border border-dashed border-[#e9dccf] bg-[#fdfaf5] px-4 py-6 text-sm focus:border-[#ffd331] focus:outline-none"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setFileForm((prev) => ({ ...prev, fileName: file ? file.name : '' }));
                  }}
                />
                {fileForm.fileName && (
                  <p className="text-xs text-gray-500">업로드된 파일: {fileForm.fileName}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-2xl bg-[#ffd331] px-6 py-2 font-semibold text-[#404040] shadow-md transition-colors hover:bg-[#e6bd2c]"
              >
                업로드
              </button>
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold">자료 리스트</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {filteredFiles.map((file) => (
                <article
                  key={file.id}
                  className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-md transition-shadow hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-[#404040]">{file.title}</h4>
                      <p className="text-sm text-gray-500">{file.className}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#f5eee9] px-3 py-1 text-xs font-semibold text-[#5c5c5c]">
                        {file.date}
                      </span>
                      <button
                        type="button"
                        className="rounded-full bg-[#f5eee9] p-2 text-[#5c5c5c] transition-colors hover:bg-[#ffd331]/80"
                        onClick={() => handleDeleteRequest('file', file.id, file.title)}
                        aria-label={`${file.title} 삭제`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  {file.description && <p className="text-sm text-gray-600">{file.description}</p>}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">파일명: {file.fileUrl.split('/').pop()}</span>
                    <button
                      type="button"
                      className="rounded-2xl bg-[#ffd331] px-3 py-1 font-semibold text-[#404040] shadow-sm transition-colors hover:bg-[#e6bd2c]"
                    >
                      다운로드
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'notice' && (
        <section className="flex flex-col gap-6">
          <form
            className="grid gap-4 rounded-3xl bg-white p-6 shadow-md"
            onSubmit={handleNoticeSubmit}
          >
            <h2 className="text-xl font-semibold">공지 관리</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" htmlFor="noticeTitle">
                  제목
                </label>
                <input
                  id="noticeTitle"
                  type="text"
                  className="rounded-2xl border border-[#e9dccf] px-4 py-2 focus:border-[#ffd331] focus:outline-none"
                  value={noticeForm.title}
                  onChange={(event) => setNoticeForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="공지 제목을 입력하세요"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" htmlFor="noticeCategory">
                  수업 카테고리
                </label>
                <select
                  id="noticeCategory"
                  className="rounded-2xl border border-[#e9dccf] px-4 py-2 focus:border-[#ffd331] focus:outline-none"
                  value={noticeForm.classId !== null ? String(noticeForm.classId) : ''}
                  onChange={(event) => {
                    const { value } = event.target;
                    setNoticeForm((prev) => ({ ...prev, classId: value === '' ? null : Number(value) }));
                  }}
                  disabled={classes.length === 0}
                  required
                >
                  <option value="" disabled>
                    수업을 선택하세요
                  </option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold" htmlFor="noticeContent">
                내용
              </label>
              <textarea
                id="noticeContent"
                className="min-h-[160px] rounded-2xl border border-[#e9dccf] px-4 py-2 focus:border-[#ffd331] focus:outline-none"
                value={noticeForm.content}
                onChange={(event) => setNoticeForm((prev) => ({ ...prev, content: event.target.value }))}
                placeholder="공지 내용을 입력하세요"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-2xl bg-[#ffd331] px-6 py-2 font-semibold text-[#404040] shadow-md transition-colors hover:bg-[#e6bd2c]"
              >
                등록
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-4">
            <div className="rounded-3xl bg-white p-6 shadow-md">
              <h3 className="mb-4 text-lg font-semibold">공지 리스트</h3>
              <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto">
                {filteredNotices.map((notice) => (
                  <div
                    key={notice.id}
                    className="flex items-start justify-between gap-3 rounded-xl bg-white p-4 shadow-md transition-shadow hover:shadow-lg"
                  >
                    <button
                      type="button"
                      className="flex-1 text-left"
                      onClick={() => setNoticeModal(notice)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-[#404040]">{notice.title}</h4>
                          <p className="text-sm text-gray-500">{notice.className}</p>
                        </div>
                        <div className="text-right text-xs text-gray-400">
                          <p>등록일 {notice.date}</p>
                          <p>작성자 {notice.author}</p>
                        </div>
                      </div>
                      <p className="line-clamp-2 text-sm text-gray-600">{notice.content}</p>
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-[#f5eee9] p-2 text-[#5c5c5c] transition-colors hover:bg-[#ffd331]/80"
                      onClick={() => handleDeleteRequest('notice', notice.id, notice.title)}
                      aria-label={`${notice.title} 삭제`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-3xl border border-dashed border-[#e9dccf] bg-white/60 p-4 text-sm text-gray-400">
              <span>페이지네이션 영역 (추후 구현 예정)</span>
            </div>
          </div>
        </section>
      )}

      {noticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-[#404040]">{noticeModal.title}</h3>
                <p className="text-sm text-gray-500">
                  {noticeModal.className} ・ {noticeModal.date} ・ {noticeModal.author}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full bg-[#f5eee9] px-3 py-1 text-sm font-semibold text-[#5c5c5c]"
                onClick={() => setNoticeModal(null)}
              >
                닫기
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-[#404040]">
              {noticeModal.content}
            </div>
          </div>
        </div>
      )}

      {deleteTarget ? (
        <AdminModal
          title="정말 삭제하시겠습니까?"
          subtitle={`${contentTypeLabel[deleteTarget.type]} 항목이 즉시 삭제됩니다.`}
          onClose={handleCloseDeleteModal}
          footer={
            <>
              <button
                type="button"
                className="rounded-2xl bg-[#f5eee9] px-5 py-2 text-sm font-semibold text-[#404040] transition-colors hover:bg-[#ffd331]/80"
                onClick={handleCloseDeleteModal}
              >
                취소
              </button>
              <button
                type="button"
                className="rounded-2xl bg-[#ff6b6b] px-5 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#e75a5a]"
                onClick={handleConfirmDelete}
              >
                삭제
              </button>
            </>
          }
        >
          <div className="space-y-3 text-sm leading-relaxed text-[#404040]">
            <p>
              선택한 {contentTypeLabel[deleteTarget.type]} 항목 <span className="font-semibold">{deleteTarget.title}</span>을(를) 삭제합니다.
            </p>
            <p className="text-xs text-[#7a6f68]">데이터베이스에서 레코드만 제거되며, 연결된 실제 파일이나 영상은 유지됩니다.</p>
          </div>
        </AdminModal>
      ) : null}

      {toast ? (
        <Toast message={toast.message} variant={toast.variant} onClose={handleToastClose} />
      ) : null}
    </div>
  );
};

export default AdminContentManagement;
