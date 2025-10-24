import { DragEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';

import AdminModal from '../../components/admin/AdminModal';
import Toast, { ToastVariant } from '../../components/admin/Toast';

const categories = ['전체', '미치나', '캔디마', '나캔디', '캔디수'];

type Category = (typeof categories)[number];

type VideoContent = {
  id: number;
  type: 'video';
  title: string;
  category: Category;
  embedCode: string;
  description?: string;
  date: string;
  order: number;
};

type FileContent = {
  id: number;
  type: 'file';
  title: string;
  category: Category;
  fileUrl: string;
  description?: string;
  date: string;
};

type NoticeContent = {
  id: number;
  type: 'notice';
  title: string;
  category: Category;
  content: string;
  author: string;
  date: string;
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

const initialVideos: VideoContent[] = [
  {
    id: 1,
    type: 'video',
    title: '미치나 8기 OT 영상',
    category: '미치나',
    embedCode:
      "<iframe class='w-full aspect-video rounded-xl' src='https://www.youtube.com/embed/dQw4w9WgXcQ' title='미치나 8기 OT 영상' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share' allowfullscreen></iframe>",
    description: '오리엔테이션 영상',
    date: '2025-10-21',
    order: 1,
  },
  {
    id: 2,
    type: 'video',
    title: '캔디마 2회차 수업 복습',
    category: '캔디마',
    embedCode:
      "<iframe class='w-full aspect-video rounded-xl' src='https://player.vimeo.com/video/76979871' title='캔디마 2회차 수업 복습' allow='autoplay; fullscreen; picture-in-picture' allowfullscreen></iframe>",
    description: '캔디마 실습 복습용 영상',
    date: '2025-10-18',
    order: 2,
  },
];

const initialFiles: FileContent[] = [
  {
    id: 1,
    type: 'file',
    title: '캔디마 수업 안내 PDF',
    category: '캔디마',
    fileUrl: '/uploads/candima-guide.pdf',
    description: '1회차 수업용 워크시트',
    date: '2025-10-21',
  },
  {
    id: 2,
    type: 'file',
    title: '미치나 프로젝트 자료 ZIP',
    category: '미치나',
    fileUrl: '/uploads/michina-project.zip',
    description: 'OT 후 배포되는 프로젝트 자료',
    date: '2025-10-19',
  },
];

const initialNotices: NoticeContent[] = [
  {
    id: 1,
    type: 'notice',
    title: '미치나 8기 시작 안내',
    category: '미치나',
    content: '미치나 8기 오리엔테이션은 내일 오후 8시에 진행됩니다.',
    author: '관리자',
    date: '2025-10-21',
  },
  {
    id: 2,
    type: 'notice',
    title: '캔디마 과제 제출 기한 연장',
    category: '캔디마',
    content: '금주 캔디마 과제 제출 기한을 일요일 밤까지로 연장합니다.',
    author: '관리자',
    date: '2025-10-20',
  },
];

const AdminContentManagement = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('video');
  const [selectedCategory, setSelectedCategory] = useState<Category>('전체');
  const [videos, setVideos] = useState<VideoContent[]>(() => hydrateVideosWithStoredOrder(initialVideos));
  const [files, setFiles] = useState(initialFiles);
  const [notices, setNotices] = useState(initialNotices);
  const [isMobile, setIsMobile] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [draggedVideoId, setDraggedVideoId] = useState<number | null>(null);

  const [videoForm, setVideoForm] = useState({
    title: '',
    category: '미치나' as Category,
    description: '',
    embedCode: '',
  });

  const [fileForm, setFileForm] = useState({
    title: '',
    category: '미치나' as Category,
    description: '',
    fileName: '',
  });

  const [noticeForm, setNoticeForm] = useState({
    title: '',
    category: '미치나' as Category,
    content: '',
  });

  const [noticeModal, setNoticeModal] = useState<NoticeContent | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredVideos = useMemo(() => {
    const baseList =
      selectedCategory === '전체'
        ? videos
        : videos.filter((video) => video.category === selectedCategory);

    return [...baseList].sort((a, b) => a.order - b.order);
  }, [selectedCategory, videos]);

  const filteredFiles = useMemo(
    () =>
      selectedCategory === '전체'
        ? files
        : files.filter((file) => file.category === selectedCategory),
    [selectedCategory, files],
  );

  const filteredNotices = useMemo(
    () =>
      selectedCategory === '전체'
        ? notices
        : notices.filter((notice) => notice.category === selectedCategory),
    [selectedCategory, notices],
  );

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
  };

  const resetVideoForm = () => {
    setVideoForm({ title: '', category: '미치나', description: '', embedCode: '' });
  };

  const resetFileForm = () => {
    setFileForm({ title: '', category: '미치나', description: '', fileName: '' });
  };

  const resetNoticeForm = () => {
    setNoticeForm({ title: '', category: '미치나', content: '' });
  };

  const handleVideoSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!videoForm.title || !videoForm.embedCode) return;

    const newVideo: VideoContent = {
      id: Date.now(),
      type: 'video',
      title: videoForm.title,
      category: videoForm.category,
      embedCode: videoForm.embedCode,
      description: videoForm.description,
      date: new Date().toISOString().split('T')[0],
      order: 0,
    };

    setVideos((prev) => {
      const updated = assignSequentialOrder([newVideo, ...prev]);
      persistVideoOrder(updated);
      return updated;
    });
    resetVideoForm();
  };

  const handleFileSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fileForm.title || !fileForm.fileName) return;

    const newFile: FileContent = {
      id: Date.now(),
      type: 'file',
      title: fileForm.title,
      category: fileForm.category,
      fileUrl: `/uploads/${fileForm.fileName}`,
      description: fileForm.description,
      date: new Date().toISOString().split('T')[0],
    };

    setFiles((prev) => [newFile, ...prev]);
    resetFileForm();
  };

  const handleNoticeSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!noticeForm.title || !noticeForm.content) return;

    const newNotice: NoticeContent = {
      id: Date.now(),
      type: 'notice',
      title: noticeForm.title,
      category: noticeForm.category,
      content: noticeForm.content,
      author: '관리자',
      date: new Date().toISOString().split('T')[0],
    };

    setNotices((prev) => [newNotice, ...prev]);
    resetNoticeForm();
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
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold">콘텐츠 관리</h1>
            <p className="text-sm text-gray-500">
              수업별 영상, 자료, 공지를 한 곳에서 관리하세요.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <label htmlFor="categoryFilter" className="font-semibold">
              수업 카테고리 필터
            </label>
            <select
              id="categoryFilter"
              className="w-48 rounded-2xl border border-[#e9dccf] bg-white px-4 py-2 text-sm shadow-sm focus:border-[#ffd331] focus:outline-none"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value as Category)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
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
                  value={videoForm.category}
                  onChange={(event) =>
                    setVideoForm((prev) => ({ ...prev, category: event.target.value as Category }))
                  }
                >
                  {categories
                    .filter((category) => category !== '전체')
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
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
                <label className="text-sm font-semibold" htmlFor="videoEmbed">
                  영상 임베드 코드
                </label>
                <textarea
                  id="videoEmbed"
                  className="min-h-[96px] rounded-2xl border border-[#e9dccf] px-4 py-2 font-mono text-xs focus:border-[#ffd331] focus:outline-none"
                  value={videoForm.embedCode}
                  onChange={(event) => setVideoForm((prev) => ({ ...prev, embedCode: event.target.value }))}
                  placeholder="&lt;iframe ...&gt;&lt;/iframe&gt;"
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
                    <div dangerouslySetInnerHTML={{ __html: video.embedCode }} />
                  </div>
                  <div className="flex items-start justify-between gap-3 px-4 pb-4 pt-3">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-[#404040]">{video.title}</h4>
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
                  value={fileForm.category}
                  onChange={(event) =>
                    setFileForm((prev) => ({ ...prev, category: event.target.value as Category }))
                  }
                >
                  {categories
                    .filter((category) => category !== '전체')
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
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
                      <p className="text-sm text-gray-500">{file.category}</p>
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
                  value={noticeForm.category}
                  onChange={(event) =>
                    setNoticeForm((prev) => ({ ...prev, category: event.target.value as Category }))
                  }
                >
                  {categories
                    .filter((category) => category !== '전체')
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
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
                          <p className="text-sm text-gray-500">{notice.category}</p>
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
                  {noticeModal.category} ・ {noticeModal.date} ・ {noticeModal.author}
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
