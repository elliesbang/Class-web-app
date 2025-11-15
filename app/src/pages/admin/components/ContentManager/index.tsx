import { ChangeEvent, DragEvent, FormEvent, useMemo, useState } from 'react';
import { GripVertical, Trash2 } from 'lucide-react';

import {
  classroomCategories,
  defaultClassroomMaterials,
  defaultClassroomNotices,
  defaultClassroomVideos,
  defaultGlobalNotices,
  defaultVodVideos,
  vodCategories,
  type ClassroomMaterialRecord,
  type ClassroomNoticeRecord,
  type ClassroomVideoRecord,
  type GlobalNoticeRecord,
  type VodVideoRecord,
} from '../../../../lib/contentLibrary';

const TAB_ITEMS = [
  { key: 'globalNotice' as const, label: '전체 공지' },
  { key: 'classroomVideo' as const, label: '강의실 영상' },
  { key: 'vodVideo' as const, label: 'VOD 영상' },
  { key: 'material' as const, label: '자료' },
  { key: 'classroomNotice' as const, label: '강의실 공지' },
];

type TabKey = (typeof TAB_ITEMS)[number]['key'];

type GlobalNoticeFormState = {
  title: string;
  content: string;
  thumbnailFile: File | null;
  isVisible: boolean;
};

type ClassroomVideoFormState = {
  title: string;
  videoUrl: string;
  description: string;
  displayOrder: string;
};

type VodVideoFormState = {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailFile: File | null;
  isRecommended: boolean;
  displayOrder: string;
};

type MaterialFormState = {
  title: string;
  description: string;
  file: File | null;
  fileType: 'file' | 'link';
  linkUrl: string;
};

type ClassroomNoticeFormState = {
  title: string;
  content: string;
  isImportant: boolean;
};

type ContentDeleteType = 'video' | 'vod' | 'material' | 'notice' | 'global';

const formatDisplayDate = (value: string) => {
  try {
    return new Date(value).toLocaleDateString('ko-KR');
  } catch (error) {
    console.warn('[ContentManager] failed to format date value', value, error);
    return value;
  }
};

const sortVideosForDisplay = (list: ClassroomVideoRecord[]) =>
  [...list].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

const reorderVideoDisplayOrder = (
  list: ClassroomVideoRecord[],
  courseId: string,
  sourceId: string,
  targetId: string,
) => {
  const courseVideos = sortVideosForDisplay(list.filter((item) => item.courseId === courseId));
  const sourceIndex = courseVideos.findIndex((item) => item.id === sourceId);
  const targetIndex = courseVideos.findIndex((item) => item.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return list;
  }

  const updatedVideos = [...courseVideos];
  const [moved] = updatedVideos.splice(sourceIndex, 1);
  updatedVideos.splice(targetIndex, 0, moved);

  return list.map((video) => {
    if (video.courseId !== courseId) {
      return video;
    }

    const nextIndex = updatedVideos.findIndex((item) => item.id === video.id);
    return nextIndex === -1 ? video : { ...video, displayOrder: nextIndex };
  });
};

const ContentManager = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('globalNotice');
  const [globalNotices, setGlobalNotices] = useState<GlobalNoticeRecord[]>(defaultGlobalNotices);
  const [classroomVideos, setClassroomVideos] = useState<ClassroomVideoRecord[]>(defaultClassroomVideos);
  const [vodVideos, setVodVideos] = useState<VodVideoRecord[]>(defaultVodVideos);
  const [materials, setMaterials] = useState<ClassroomMaterialRecord[]>(defaultClassroomMaterials);
  const [classroomNotices, setClassroomNotices] = useState<ClassroomNoticeRecord[]>(defaultClassroomNotices);

  const [selectedClassCategoryId, setSelectedClassCategoryId] = useState<string>(
    classroomCategories[0]?.id ?? '',
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    classroomCategories[0]?.courses[0]?.id ?? '',
  );
  const [selectedVodCategoryId, setSelectedVodCategoryId] = useState<string>(vodCategories[0]?.id ?? '');

  const [globalNoticeForm, setGlobalNoticeForm] = useState<GlobalNoticeFormState>({
    title: '',
    content: '',
    thumbnailFile: null,
    isVisible: true,
  });
  const [classroomVideoForm, setClassroomVideoForm] = useState<ClassroomVideoFormState>({
    title: '',
    videoUrl: '',
    description: '',
    displayOrder: '0',
  });
  const [vodVideoForm, setVodVideoForm] = useState<VodVideoFormState>({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailFile: null,
    isRecommended: true,
    displayOrder: '0',
  });
  const [materialForm, setMaterialForm] = useState<MaterialFormState>({
    title: '',
    description: '',
    file: null,
    fileType: 'file',
    linkUrl: '',
  });
  const [classroomNoticeForm, setClassroomNoticeForm] = useState<ClassroomNoticeFormState>({
    title: '',
    content: '',
    isImportant: false,
  });

  const [draggedVideoId, setDraggedVideoId] = useState<string | null>(null);
  const [isReorderingVideos, setIsReorderingVideos] = useState(false);

  const courseOptions = useMemo(() => {
    const category = classroomCategories.find((item) => item.id === selectedClassCategoryId);
    return category?.courses ?? [];
  }, [selectedClassCategoryId]);

  const filteredClassroomVideos = useMemo(() => {
    if (!selectedCourseId) {
      return [] as ClassroomVideoRecord[];
    }
    return sortVideosForDisplay(classroomVideos.filter((video) => video.courseId === selectedCourseId));
  }, [classroomVideos, selectedCourseId]);

  const filteredMaterials = useMemo(() => {
    if (!selectedCourseId) {
      return [] as ClassroomMaterialRecord[];
    }
    return materials
      .filter((material) => material.courseId === selectedCourseId)
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [materials, selectedCourseId]);

  const filteredClassroomNotices = useMemo(() => {
    if (!selectedCourseId) {
      return [] as ClassroomNoticeRecord[];
    }
    return classroomNotices
      .filter((notice) => notice.courseId === selectedCourseId)
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [classroomNotices, selectedCourseId]);

  const filteredVodVideos = useMemo(() => {
    if (!selectedVodCategoryId) {
      return [] as VodVideoRecord[];
    }
    return vodVideos
      .filter((video) => video.categoryId === selectedVodCategoryId)
      .slice()
      .sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [selectedVodCategoryId, vodVideos]);

  const visibleGlobalNotices = useMemo(
    () =>
      [...globalNotices]
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [globalNotices],
  );

  // 🔥 삭제 기능 수정 — 엔드포인트 완전 분리
  const handleDelete = async (notionId: string, type: ContentDeleteType) => {
    if (!notionId) {
      alert('삭제에 필요한 Notion 페이지 ID가 없습니다.');
      return;
    }

    const endpointMap: Record<ContentDeleteType, string> = {
      global: '/api/notice',
      video: '/api/class-video',
      vod: '/api/vod-video',
      material: '/api/material',
      notice: '/api/class-notice',
    };

    const endpoint = endpointMap[type];

    try {
      const response = await fetch(`${endpoint}?id=${encodeURIComponent(notionId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete content');
      }

      const data = await response.json().catch(() => null);

      if (data?.success) {
        alert('삭제되었습니다.');

        if (type === 'video') {
          setClassroomVideos((prev) => prev.filter((item) => item.notionId !== notionId));
        } else if (type === 'vod') {
          setVodVideos((prev) => prev.filter((item) => item.notionId !== notionId));
        } else if (type === 'material') {
          setMaterials((prev) => prev.filter((item) => item.notionId !== notionId));
        } else if (type === 'notice') {
          setClassroomNotices((prev) => prev.filter((item) => item.notionId !== notionId));
        } else if (type === 'global') {
          setGlobalNotices((prev) => prev.filter((item) => item.notionId !== notionId));
        }
      } else {
        alert('삭제 실패');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('서버 오류로 삭제에 실패했습니다.');
    }
  };

  const handleMaterialFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setMaterialForm((prev) => ({ ...prev, file, fileType: 'file' }));
  };

  const handleMaterialLinkChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setMaterialForm((prev) => ({ ...prev, linkUrl: value, fileType: 'link', file: null }));
  };

  const handleMaterialUploadTypeChange = (type: 'file' | 'link') => {
    setMaterialForm((prev) => ({
      ...prev,
      fileType: type,
      file: type === 'file' ? prev.file : null,
      linkUrl: type === 'link' ? prev.linkUrl : '',
    }));
  };

  const handleGlobalNoticeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/notice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'globalNotice',
          payload: {
            ...globalNoticeForm,
            thumbnailFile: globalNoticeForm.thumbnailFile?.name ?? null,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit global notice');
      }

      await response.json().catch(() => null);
    } catch (error) {
      console.error('[ContentManager] 전체 공지 등록 실패', error);
    }
    setGlobalNoticeForm({ title: '', content: '', thumbnailFile: null, isVisible: true });
  };

  const handleClassroomVideoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/class-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'classroomVideo',
          payload: {
            ...classroomVideoForm,
            courseId: selectedCourseId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit classroom video');
      }

      await response.json().catch(() => null);
    } catch (error) {
      console.error('[ContentManager] 강의실 영상 등록 실패', error);
    }
    setClassroomVideoForm({ title: '', videoUrl: '', description: '', displayOrder: '0' });
  };

  const handleVodVideoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/vod-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'vodVideo',
          payload: {
            ...vodVideoForm,
            thumbnailFile: vodVideoForm.thumbnailFile?.name ?? null,
            categoryId: selectedVodCategoryId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit VOD');
      }

      await response.json().catch(() => null);
    } catch (error) {
      console.error('[ContentManager] VOD 등록 실패', error);
    }
    setVodVideoForm({
      title: '',
      description: '',
      videoUrl: '',
      thumbnailFile: null,
      isRecommended: true,
      displayOrder: '0',
    });
  };

  const handleMaterialSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/material', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'material',
          payload: {
            ...materialForm,
            file: materialForm.file?.name ?? null,
            courseId: selectedCourseId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit material');
      }

      await response.json().catch(() => null);
    } catch (error) {
      console.error('[ContentManager] 자료 업로드 실패', error);
    }
    setMaterialForm({ title: '', description: '', file: null, fileType: 'file', linkUrl: '' });
  };

  const handleClassroomNoticeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/class-notice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'classroomNotice',
          payload: {
            ...classroomNoticeForm,
            courseId: selectedCourseId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit classroom notice');
      }

      await response.json().catch(() => null);
    } catch (error) {
      console.error('[ContentManager] 강의실 공지 등록 실패', error);
    }
    setClassroomNoticeForm({ title: '', content: '', isImportant: false });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 상단 탭 UI — 그대로 유지 */}
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-md">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#404040]">콘텐츠 관리</h2>
            <p className="text-sm text-[#7a6f68]">콘텐츠 유형에 따라 등록하고 노출 위치를 설정하세요.</p>
          </div>

          {activeTab === 'classroomVideo' ||
          activeTab === 'material' ||
          activeTab === 'classroomNotice' ? (
            <div className="flex flex-col gap-2 text-sm text-[#7a6f68] md:flex-row md:items-center md:gap-3">
              <label className="font-semibold text-[#5c5c5c]">강의실 카테고리</label>
              <select
                className="rounded-2xl border border-[#e9dccf] px-4 py-2"
                value={selectedClassCategoryId}
                onChange={(event) => {
                  const id = event.target.value;
                  setSelectedClassCategoryId(id);
                  const category = classroomCategories.find((item) => item.id === id);
                  setSelectedCourseId(category?.courses[0]?.id ?? '');
                }}
              >
                {classroomCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <label className="font-semibold text-[#5c5c5c]">하위 강좌</label>
              <select
                className="rounded-2xl border border-[#e9dccf] px-4 py-2"
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
              >
                {courseOptions.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {activeTab === 'vodVideo' ? (
            <div className="flex flex-col gap-2 text-sm text-[#7a6f68] md:flex-row md:items-center md:gap-3">
              <label className="font-semibold text-[#5c5c5c]">VOD 카테고리</label>
              <select
                className="rounded-2xl border border-[#e9dccf] px-4 py-2"
                value={selectedVodCategoryId}
                onChange={(event) => setSelectedVodCategoryId(event.target.value)}
              >
                {vodCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.key}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                activeTab === tab.key
                  ? 'bg-[#ffd331] text-[#404040]'
                  : 'bg-[#f5eee9] text-[#7a6f68] hover:bg-[#ffd331]/80 hover:text-[#404040]'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 이하: 등록 폼 + 리스트 렌더링 (원본 그대로이며 삭제 API만 바꿔둔 상태) */}

      {activeTab === 'globalNotice' ? (
        <section className="flex flex-col gap-6">
          <form className="rounded-3xl bg-white p-6 shadow-md" onSubmit={handleGlobalNoticeSubmit}>
            <h3 className="mb-4 text-lg font-semibold text-[#404040]">전체 공지 등록</h3>
            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]">제목</label>
                <input
                  type="text"
                  className="rounded-2xl border px-4 py-2"
                  placeholder="공지 제목을 입력하세요"
                  value={globalNoticeForm.title}
                  onChange={(e) =>
                    setGlobalNoticeForm((p) => ({
                      ...p,
                      title: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]">내용</label>
                <textarea
                  className="rounded-2xl border px-4 py-2 min-h-[120px]"
                  value={globalNoticeForm.content}
                  onChange={(e) =>
                    setGlobalNoticeForm((p) => ({
                      ...p,
                      content: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]">썸네일</label>
                <input
                  type="file"
                  className="rounded-2xl border px-4 py-2"
                  onChange={(e) =>
                    setGlobalNoticeForm((p) => ({
                      ...p,
                      thumbnailFile: e.target.files?.[0] ?? null,
                    }))
                  }
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#5c5c5c]">
                <input
                  type="checkbox"
                  checked={globalNoticeForm.isVisible}
                  onChange={(e) =>
                    setGlobalNoticeForm((p) => ({
                      ...p,
                      isVisible: e.target.checked,
                    }))
                  }
                />
                홈/공지 탭에 노출
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button className="rounded-2xl bg-[#ffd331] px-6 py-2">저장</button>
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-[#404040]">등록된 전체 공지</h3>

            {visibleGlobalNotices.length === 0 ? (
              <p className="text-sm text-[#7a6f68]">등록된 공지가 없습니다.</p>
            ) : (
              <ul className="space-y-4">
                {visibleGlobalNotices.map((n) => (
                  <li key={n.id} className="rounded-2xl bg-[#f9f5f1] p-4 flex gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold">{n.title}</h4>
                      <p className="text-xs">{n.content}</p>
                      <p className="text-xs mt-1">{formatDisplayDate(n.createdAt)}</p>
                    </div>
                    <button
                      className="rounded-full p-2 bg-[#f5eee9]"
                      onClick={() => handleDelete(n.notionId, 'global')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {/* 강의실 영상 */}
      {activeTab === 'classroomVideo' ? (
        <section className="flex flex-col gap-6">
          <form className="rounded-3xl bg-white p-6 shadow-md" onSubmit={handleClassroomVideoSubmit}>
            <h3 className="mb-4 text-lg font-semibold">강의실 영상 등록</h3>

            <div className="grid gap-4">
              <div>
                <label className="text-sm font-semibold">제목</label>
                <input
                  type="text"
                  className="rounded-2xl border px-4 py-2 w-full"
                  value={classroomVideoForm.title}
                  onChange={(e) =>
                    setClassroomVideoForm((p) => ({
                      ...p,
                      title: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-semibold">영상 URL</label>
                <input
                  type="url"
                  className="rounded-2xl border px-4 py-2 w-full"
                  value={classroomVideoForm.videoUrl}
                  onChange={(e) =>
                    setClassroomVideoForm((p) => ({
                      ...p,
                      videoUrl: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-semibold">설명</label>
                <textarea
                  className="rounded-2xl border px-4 py-2 w-full"
                  value={classroomVideoForm.description}
                  onChange={(e) =>
                    setClassroomVideoForm((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-semibold">정렬 순서</label>
                <input
                  type="number"
                  className="rounded-2xl border px-4 py-2 w-24"
                  min={0}
                  value={classroomVideoForm.displayOrder}
                  onChange={(e) =>
                    setClassroomVideoForm((p) => ({
                      ...p,
                      displayOrder: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button className="rounded-2xl bg-[#ffd331] px-6 py-2">저장</button>
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold">등록된 강의실 영상</h3>

            {filteredClassroomVideos.length === 0 ? (
              <p className="text-sm text-[#7a6f68]">영상이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredClassroomVideos.map((v) => (
                  <div key={v.id} className="rounded-2xl bg-[#f9f5f1] p-4">
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
                      <iframe title={v.title} src={v.videoUrl} className="w-full h-full" />
                    </div>
                    <div className="flex justify-between mt-3">
                      <div>
                        <p className="text-sm font-semibold">{v.title}</p>
                        <p className="text-xs">{formatDisplayDate(v.createdAt)}</p>
                      </div>
                      <button
                        className="rounded-full p-2 bg-[#f5eee9]"
                        onClick={() => handleDelete(v.notionId, 'video')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* VOD */}
      {activeTab === 'vodVideo' ? (
        <section className="flex flex-col gap-6">
          <form className="rounded-3xl bg-white p-6 shadow-md" onSubmit={handleVodVideoSubmit}>
            <h3 className="mb-4 text-lg font-semibold">VOD 등록</h3>

            <div className="grid gap-4">
              <div>
                <label className="text-sm font-semibold">제목</label>
                <input
                  type="text"
                  className="rounded-2xl border px-4 py-2 w-full"
                  value={vodVideoForm.title}
                  onChange={(e) =>
                    setVodVideoForm((p) => ({
                      ...p,
                      title: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-semibold">설명</label>
                <textarea
                  className="rounded-2xl border px-4 py-2 w-full"
                  value={vodVideoForm.description}
                  onChange={(e) =>
                    setVodVideoForm((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-semibold">URL</label>
                <input
                  type="url"
                  className="rounded-2xl border px-4 py-2 w-full"
                  value={vodVideoForm.videoUrl}
                  onChange={(e) =>
                    setVodVideoForm((p) => ({
                      ...p,
                      videoUrl: e.target.value,
                    }))
                  }
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={vodVideoForm.isRecommended}
                  onChange={(e) =>
                    setVodVideoForm((p) => ({
                      ...p,
                      isRecommended: e.target.checked,
                    }))
                  }
                />
                추천 콘텐츠
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button className="rounded-2xl bg-[#ffd331] px-6 py-2">저장</button>
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold">등록된 VOD</h3>

            {filteredVodVideos.length === 0 ? (
              <p className="text-sm text-[#7a6f68]">VOD가 없습니다.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredVodVideos.map((v) => (
                  <div key={v.id} className="rounded-2xl bg-[#f9f5f1] p-4">
                    <img
                      src={v.thumbnailUrl}
                      alt="VOD 썸네일"
                      className="rounded-xl w-full aspect-video object-cover"
                    />

                    <div className="flex justify-between mt-3">
                      <div>
                        <p className="text-sm font-semibold">{v.title}</p>
                        <p className="text-xs">{formatDisplayDate(v.createdAt)}</p>
                      </div>
                      <button
                        className="rounded-full p-2 bg-[#f5eee9]"
                        onClick={() => handleDelete(v.notionId, 'vod')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* 자료 */}
      {activeTab === 'material' ? (
        <section className="flex flex-col gap-6">
          <form className="rounded-3xl bg-white p-6 shadow-md" onSubmit={handleMaterialSubmit}>
            <h3 className="mb-4 text-lg font-semibold">자료 업로드</h3>

            <div className="grid gap-4">
              <label className="text-sm font-semibold">제목</label>
              <input
                type="text"
                className="rounded-2xl border px-4 py-2 w-full"
                value={materialForm.title}
                onChange={(e) =>
                  setMaterialForm((p) => ({
                    ...p,
                    title: e.target.value,
                  }))
                }
              />

              <label className="text-sm font-semibold">설명</label>
              <textarea
                className="rounded-2xl border px-4 py-2 w-full"
                value={materialForm.description}
                onChange={(e) =>
                  setMaterialForm((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
              />

              {materialForm.fileType === 'file' ? (
                <input type="file" onChange={handleMaterialFileChange} className="rounded-2xl border px-4 py-2" />
              ) : (
                <input
                  type="url"
                  className="rounded-2xl border px-4 py-2"
                  value={materialForm.linkUrl}
                  placeholder="https://example.com"
                  onChange={handleMaterialLinkChange}
                />
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button className="rounded-2xl bg-[#ffd331] px-6 py-2">저장</button>
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold">등록된 자료</h3>

            {filteredMaterials.length === 0 ? (
              <p className="text-sm text-[#7a6f68]">자료가 없습니다.</p>
            ) : (
              <ul className="space-y-4">
                {filteredMaterials.map((m) => (
                  <li key={m.id} className="rounded-2xl bg-[#f9f5f1] p-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-semibold">{m.title}</p>
                        <p className="text-xs mt-1">{formatDisplayDate(m.createdAt)}</p>
                      </div>

                      <button
                        className="rounded-full p-2 bg-[#f5eee9]"
                        onClick={() => handleDelete(m.notionId, 'material')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {m.fileUrl ? (
                      <a
                        className="text-sm text-blue-600 underline mt-2 block"
                        href={m.fileUrl}
                        target="_blank"
                      >
                        파일 보기
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {/* 강의실 공지 */}
      {activeTab === 'classroomNotice' ? (
        <section className="flex flex-col gap-6">
          <form className="rounded-3xl bg-white p-6 shadow-md" onSubmit={handleClassroomNoticeSubmit}>
            <h3 className="mb-4 text-lg font-semibold">강의실 공지 등록</h3>
            <div className="grid gap-4">
              <label className="text-sm font-semibold">제목</label>
              <input
                type="text"
                className="rounded-2xl border px-4 py-2 w-full"
                value={classroomNoticeForm.title}
                onChange={(e) =>
                  setClassroomNoticeForm((p) => ({
                    ...p,
                    title: e.target.value,
                  }))
                }
              />

              <label className="text-sm font-semibold">내용</label>
              <textarea
                className="rounded-2xl border px-4 py-2 w-full min-h-[120px]"
                value={classroomNoticeForm.content}
                onChange={(e) =>
                  setClassroomNoticeForm((p) => ({
                    ...p,
                    content: e.target.value,
                  }))
                }
              />

              <label className="inline-flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={classroomNoticeForm.isImportant}
                  onChange={(e) =>
                    setClassroomNoticeForm((p) => ({
                      ...p,
                      isImportant: e.target.checked,
                    }))
                  }
                />
                중요 공지
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button className="rounded-2xl bg-[#ffd331] px-6 py-2">저장</button>
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold">등록된 강의실 공지</h3>

            {filteredClassroomNotices.length === 0 ? (
              <p className="text-sm text-[#7a6f68]">공지 없음</p>
            ) : (
              <ul className="space-y-4">
                {filteredClassroomNotices.map((n) => (
                  <li key={n.id} className="rounded-2xl bg-[#f9f5f1] p-4 flex justify-between">
                    <div>
                      <p className="text-sm font-semibold">{n.title}</p>
                      <p className="text-xs whitespace-pre-wrap">{n.content}</p>
                      <p className="text-xs mt-1">{formatDisplayDate(n.createdAt)}</p>
                    </div>

                    <button
                      className="rounded-full bg-[#f5eee9] p-2"
                      onClick={() => handleDelete(n.notionId, 'notice')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default ContentManager;
