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

  const handleVideoDragStart = (id: string) => () => {
    setDraggedVideoId(id);
  };

  const handleVideoDragEnd = () => {
    setDraggedVideoId(null);
  };

  const handleVideoDrop = (targetId: string) => {
    if (!selectedCourseId || !draggedVideoId) {
      return;
    }

    setIsReorderingVideos(true);
    setClassroomVideos((prev) => reorderVideoDisplayOrder(prev, selectedCourseId, draggedVideoId, targetId));
    setTimeout(() => {
      setIsReorderingVideos(false);
    }, 400);
    setDraggedVideoId(null);
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
      const response = await fetch('/api/contents', {
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
      const response = await fetch('/api/contents', {
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
      const response = await fetch('/api/contents', {
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
      const response = await fetch('/api/contents', {
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
      const response = await fetch('/api/contents', {
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

  const handleDelete = async (notionId: string, type: ContentDeleteType) => {
    if (!notionId) {
      alert('삭제에 필요한 Notion 페이지 ID가 없습니다.');
      return;
    }
    try {
      const response = await fetch(`/api/contents?id=${encodeURIComponent(notionId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete content');
      }

      const data: { success?: boolean } | null = await response.json().catch(() => null);

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
        alert('삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('서버 오류로 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-md">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#404040]">콘텐츠 관리</h2>
            <p className="text-sm text-[#7a6f68]">
              콘텐츠 유형에 따라 등록하고 노출 위치를 설정하세요.
            </p>
          </div>
          {activeTab === 'classroomVideo' || activeTab === 'material' || activeTab === 'classroomNotice' ? (
            <div className="flex flex-col gap-2 text-sm text-[#7a6f68] md:flex-row md:items-center md:gap-3">
              <label className="font-semibold text-[#5c5c5c]" htmlFor="classCategorySelect">
                강의실 카테고리
              </label>
              <select
                id="classCategorySelect"
                className="rounded-2xl border border-[#e9dccf] bg-white px-4 py-2 text-sm font-semibold text-[#404040] focus:border-[#ffd331] focus:outline-none"
                value={selectedClassCategoryId}
                onChange={(event) => {
                  const nextCategoryId = event.target.value;
                  setSelectedClassCategoryId(nextCategoryId);
                  const category = classroomCategories.find((item) => item.id === nextCategoryId);
                  const firstCourse = category?.courses[0]?.id ?? '';
                  setSelectedCourseId(firstCourse);
                }}
              >
                {classroomCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <label className="font-semibold text-[#5c5c5c]" htmlFor="courseSelect">
                하위 강좌
              </label>
              <select
                id="courseSelect"
                className="rounded-2xl border border-[#e9dccf] bg-white px-4 py-2 text-sm font-semibold text-[#404040] focus:border-[#ffd331] focus:outline-none"
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
              <label className="font-semibold text-[#5c5c5c]" htmlFor="vodCategorySelect">
                VOD 카테고리
              </label>
              <select
                id="vodCategorySelect"
                className="rounded-2xl border border-[#e9dccf] bg-white px-4 py-2 text-sm font-semibold text-[#404040] focus:border-[#ffd331] focus:outline-none"
                value={selectedVodCategoryId}
                onChange={(event) => setSelectedVodCategoryId(event.target.value)}
              >
                {vodCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
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

      {activeTab === 'globalNotice' ? (
        <section className="flex flex-col gap-6">
          <form className="rounded-3xl bg-white p-6 shadow-md" onSubmit={handleGlobalNoticeSubmit}>
            <h3 className="mb-4 text-lg font-semibold text-[#404040]">전체 공지 등록</h3>
            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="globalNoticeTitle">
                  제목
                </label>
                <input
                  id="globalNoticeTitle"
                  type="text"
                  className="rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  placeholder="공지 제목을 입력하세요"
                  value={globalNoticeForm.title}
                  onChange={(event) => setGlobalNoticeForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="globalNoticeContent">
                  내용
                </label>
                <textarea
                  id="globalNoticeContent"
                  className="min-h-[120px] rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  placeholder="공지 내용을 입력하세요"
                  value={globalNoticeForm.content}
                  onChange={(event) => setGlobalNoticeForm((prev) => ({ ...prev, content: event.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#5c5c5c]">썸네일</span>
                <input
                  type="file"
                  accept="image/*"
                  className="rounded-2xl border border-dashed border-[#e9dccf] px-4 py-3 text-sm focus:border-[#ffd331] focus:outline-none"
                  onChange={(event) =>
                    setGlobalNoticeForm((prev) => ({ ...prev, thumbnailFile: event.target.files?.[0] ?? null }))
                  }
                />
                {globalNoticeForm.thumbnailFile ? (
                  <p className="text-xs text-[#7a6f68]">선택된 파일: {globalNoticeForm.thumbnailFile.name}</p>
                ) : null}
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#5c5c5c]">
                <input
                  type="checkbox"
                  checked={globalNoticeForm.isVisible}
                  onChange={(event) =>
                    setGlobalNoticeForm((prev) => ({ ...prev, isVisible: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-[#e9dccf] text-[#ffd331] focus:ring-[#ffd331]"
                />
                홈/공지 탭에 노출하기
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="rounded-2xl bg-[#ffd331] px-6 py-2 text-sm font-semibold text-[#404040] shadow-md transition-colors hover:bg-[#e6bd2c]"
              >
                저장
              </button>
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-[#404040]">등록된 전체 공지</h3>
            {visibleGlobalNotices.length === 0 ? (
              <p className="text-sm text-[#7a6f68]">등록된 공지가 없습니다.</p>
            ) : (
              <ul className="space-y-4">
                {visibleGlobalNotices.map((notice) => (
                  <li key={notice.id} className="flex flex-col gap-4 rounded-2xl bg-[#f9f5f1] p-4 shadow-sm md:flex-row">
                    {notice.thumbnailUrl ? (
                      <div className="h-20 w-full overflow-hidden rounded-xl bg-[#fffaf0] md:h-24 md:w-40">
                        <img
                          src={notice.thumbnailUrl}
                          alt="공지 썸네일"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <h4 className="text-sm font-semibold text-[#404040]">{notice.title}</h4>
                        <span className="text-xs font-semibold text-[#7a6f68]">
                          {formatDisplayDate(notice.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-[#5c5c5c]">{notice.content}</p>
                      <span className={`text-xs font-semibold ${notice.isVisible ? 'text-green-600' : 'text-[#7a6f68]'}`}>
                        {notice.isVisible ? '노출 중' : '비노출'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="self-start rounded-full bg-[#f5eee9] p-2 text-[#5c5c5c] transition-colors hover:bg-[#ffd331]/80"
                      onClick={() => handleDelete(notice.notionId, 'global')}
                      aria-label="공지 삭제"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === 'classroomVideo' ? (
        <section className="flex flex-col gap-6">
          <form className="rounded-3xl bg-white p-6 shadow-md" onSubmit={handleClassroomVideoSubmit}>
            <h3 className="mb-4 text-lg font-semibold text-[#404040]">강의실 영상 등록</h3>
            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="classroomVideoTitle">
                  제목
                </label>
                <input
                  id="classroomVideoTitle"
                  type="text"
                  className="rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  placeholder="예: 1주차 오리엔테이션"
                  value={classroomVideoForm.title}
                  onChange={(event) => setClassroomVideoForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="classroomVideoUrl">
                  영상 URL
                </label>
                <input
                  id="classroomVideoUrl"
                  type="url"
                  className="rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  placeholder="https://player.vimeo.com/..."
                  value={classroomVideoForm.videoUrl}
                  onChange={(event) => setClassroomVideoForm((prev) => ({ ...prev, videoUrl: event.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="classroomVideoDescription">
                  설명
                </label>
                <textarea
                  id="classroomVideoDescription"
                  className="min-h-[80px] rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  placeholder="영상 소개를 입력하세요"
                  value={classroomVideoForm.description}
                  onChange={(event) =>
                    setClassroomVideoForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="classroomVideoOrder">
                  정렬 순서
                </label>
                <input
                  id="classroomVideoOrder"
                  type="number"
                  min={0}
                  className="w-24 rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  value={classroomVideoForm.displayOrder}
                  onChange={(event) =>
                    setClassroomVideoForm((prev) => ({ ...prev, displayOrder: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="rounded-2xl bg-[#ffd331] px-6 py-2 text-sm font-semibold text-[#404040] shadow-md transition-colors hover:bg-[#e6bd2c]"
              >
                저장
              </button>
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-[#404040]">노출 순서</h3>
              {isReorderingVideos ? (
                <span className="text-xs text-[#7a6f68]">순서를 조정 중입니다...</span>
              ) : null}
            </div>
            {filteredClassroomVideos.length === 0 ? (
              <p className="text-sm text-[#7a6f68]">해당 강좌에 등록된 영상이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredClassroomVideos.map((video) => (
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
                      handleVideoDrop(video.id);
                    }}
                  >
                    <div className="flex items-center justify-between text-[#7a6f68]">
                      <span className="flex items-center gap-2 text-xs">
                        <GripVertical className="h-4 w-4" aria-hidden="true" />
                        드래그하여 순서 변경
                      </span>
                      <span className="text-xs font-semibold">#{video.displayOrder + 1}</span>
                    </div>
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/5">
                      <iframe
                        title={video.title || '강의실 영상'}
                        src={video.videoUrl}
                        className="h-full w-full border-0"
                        allow="fullscreen"
                      />
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-[#404040]">{video.title}</span>
                        {video.description ? (
                          <p className="text-xs text-[#5c5c5c]">{video.description}</p>
                        ) : null}
                        <span className="text-xs text-[#7a6f68]">{formatDisplayDate(video.createdAt)}</span>
                      </div>
                      <button
                        type="button"
                        className="rounded-full bg-[#f5eee9] p-2 text-[#5c5c5c] transition-colors hover:bg-[#ffd331]/80"
                        onClick={() => handleDelete(video.notionId, 'video')}
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
      ) : null}

      {activeTab === 'vodVideo' ? (
        <section className="flex flex-col gap-6">
          <form className="rounded-3xl bg-white p-6 shadow-md" onSubmit={handleVodVideoSubmit}>
            <h3 className="mb-4 text-lg font-semibold text-[#404040]">VOD 영상 등록</h3>
            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="vodTitle">
                  제목
                </label>
                <input
                  id="vodTitle"
                  type="text"
                  className="rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  placeholder="예: 디자인 템플릿으로 수익 만들기"
                  value={vodVideoForm.title}
                  onChange={(event) => setVodVideoForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="vodDescription">
                  설명
                </label>
                <textarea
                  id="vodDescription"
                  className="min-h-[80px] rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  placeholder="영상에 대한 설명을 입력하세요"
                  value={vodVideoForm.description}
                  onChange={(event) => setVodVideoForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="vodUrl">
                  영상 URL
                </label>
                <input
                  id="vodUrl"
                  type="url"
                  className="rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  placeholder="https://player.vimeo.com/..."
                  value={vodVideoForm.videoUrl}
                  onChange={(event) => setVodVideoForm((prev) => ({ ...prev, videoUrl: event.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#5c5c5c]">썸네일</span>
                <input
                  type="file"
                  accept="image/*"
                  className="rounded-2xl border border-dashed border-[#e9dccf] px-4 py-3 text-sm focus:border-[#ffd331] focus:outline-none"
                  onChange={(event) => setVodVideoForm((prev) => ({ ...prev, thumbnailFile: event.target.files?.[0] ?? null }))}
                />
                {vodVideoForm.thumbnailFile ? (
                  <p className="text-xs text-[#7a6f68]">선택된 파일: {vodVideoForm.thumbnailFile.name}</p>
                ) : null}
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#5c5c5c]">
                <input
                  type="checkbox"
                  checked={vodVideoForm.isRecommended}
                  onChange={(event) =>
                    setVodVideoForm((prev) => ({ ...prev, isRecommended: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-[#e9dccf] text-[#ffd331] focus:ring-[#ffd331]"
                />
                추천 콘텐츠로 노출하기
              </label>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="vodOrder">
                  정렬 순서
                </label>
                <input
                  id="vodOrder"
                  type="number"
                  min={0}
                  className="w-24 rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  value={vodVideoForm.displayOrder}
                  onChange={(event) => setVodVideoForm((prev) => ({ ...prev, displayOrder: event.target.value }))}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="rounded-2xl bg-[#ffd331] px-6 py-2 text-sm font-semibold text-[#404040] shadow-md transition-colors hover:bg-[#e6bd2c]"
              >
                저장
              </button>
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-[#404040]">등록된 VOD</h3>
            {filteredVodVideos.length === 0 ? (
              <p className="text-sm text-[#7a6f68]">선택한 카테고리에 등록된 VOD 영상이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredVodVideos.map((video) => (
                  <article key={video.id} className="flex flex-col gap-3 rounded-2xl bg-[#f9f5f1] p-4 shadow-sm">
                    <div className="aspect-video w-full overflow-hidden rounded-xl bg-[#fffaf0]">
                      <img src={video.thumbnailUrl} alt="VOD 썸네일" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-[#404040]">{video.title}</span>
                      {video.description ? (
                        <p className="text-xs text-[#5c5c5c]">{video.description}</p>
                      ) : null}
                      <div className="flex items-center justify-between text-xs text-[#7a6f68]">
                        <span>{formatDisplayDate(video.createdAt)}</span>
                        <span>#{video.displayOrder + 1}</span>
                      </div>
                      {video.isRecommended ? (
                        <span className="self-start rounded-full bg-[#ffd331] px-3 py-1 text-[10px] font-semibold text-[#404040]">
                          추천
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="self-start rounded-full bg-[#f5eee9] p-2 text-[#5c5c5c] transition-colors hover:bg-[#ffd331]/80"
                      onClick={() => handleDelete(video.notionId, 'vod')}
                      aria-label="VOD 삭제"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === 'material' ? (
        <section className="flex flex-col gap-6">
          <form className="rounded-3xl bg-white p-6 shadow-md" onSubmit={handleMaterialSubmit}>
            <h3 className="mb-4 text-lg font-semibold text-[#404040]">자료 업로드</h3>
            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="materialTitle">
                  자료 제목
                </label>
                <input
                  id="materialTitle"
                  type="text"
                  className="rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  placeholder="예: 워크북 템플릿"
                  value={materialForm.title}
                  onChange={(event) => setMaterialForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="materialDescription">
                  설명
                </label>
                <textarea
                  id="materialDescription"
                  className="min-h-[80px] rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  placeholder="자료 설명을 입력하세요"
                  value={materialForm.description}
                  onChange={(event) => setMaterialForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors ${
                      materialForm.fileType === 'file'
                        ? 'border-[#ffd331] bg-[#ffd331] text-[#404040] shadow-sm'
                        : 'border-[#e9dccf] bg-white text-[#5c5c5c] hover:border-[#ffd331] hover:bg-[#fff6d6]'
                    }`}
                    onClick={() => handleMaterialUploadTypeChange('file')}
                  >
                    파일 업로드
                  </button>
                  <button
                    type="button"
                    className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors ${
                      materialForm.fileType === 'link'
                        ? 'border-[#ffd331] bg-[#ffd331] text-[#404040] shadow-sm'
                        : 'border-[#e9dccf] bg-white text-[#5c5c5c] hover:border-[#ffd331] hover:bg-[#fff6d6]'
                    }`}
                    onClick={() => handleMaterialUploadTypeChange('link')}
                  >
                    링크 업로드
                  </button>
                </div>
                <p className="text-xs text-[#7a6f68]">파일을 직접 첨부하거나 링크 자료를 연결할 수 있습니다.</p>
              </div>
              {materialForm.fileType === 'file' ? (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="materialFile">
                    파일 첨부
                  </label>
                  <input
                    id="materialFile"
                    type="file"
                    className="rounded-2xl border border-dashed border-[#e9dccf] px-4 py-3 text-sm focus:border-[#ffd331] focus:outline-none"
                    onChange={handleMaterialFileChange}
                  />
                  {materialForm.file ? (
                    <p className="text-xs text-[#7a6f68]">선택된 파일: {materialForm.file.name}</p>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="materialLink">
                    링크 URL
                  </label>
                  <input
                    id="materialLink"
                    type="url"
                    placeholder="https://example.com/resource"
                    className="rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                    value={materialForm.linkUrl}
                    onChange={handleMaterialLinkChange}
                  />
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="rounded-2xl bg-[#ffd331] px-6 py-2 text-sm font-semibold text-[#404040] shadow-md transition-colors hover:bg-[#e6bd2c]"
              >
                저장
              </button>
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-[#404040]">등록된 자료</h3>
            {filteredMaterials.length === 0 ? (
              <p className="text-sm text-[#7a6f68]">해당 강좌에 등록된 자료가 없습니다.</p>
            ) : (
              <ul className="space-y-4">
                {filteredMaterials.map((material) => (
                  <li key={material.id} className="rounded-2xl bg-[#f9f5f1] p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-[#404040]">{material.title}</h4>
                        {material.description ? (
                          <p className="mt-1 text-xs text-[#5c5c5c]">{material.description}</p>
                        ) : null}
                        <p className="mt-2 text-xs text-[#7a6f68]">{formatDisplayDate(material.createdAt)}</p>
                      </div>
                      <div className="flex flex-col gap-2 text-xs font-semibold text-[#404040]">
                        <a
                          href={material.fileUrl}
                          target={material.fileType === 'link' ? '_blank' : undefined}
                          rel={material.fileType === 'link' ? 'noopener noreferrer' : undefined}
                          download={material.fileType === 'file' ? material.fileName : undefined}
                          className="rounded-full bg-[#ffd331] px-4 py-2 text-center shadow-sm transition-colors hover:bg-[#e6bd2c]"
                        >
                          {material.fileType === 'file' ? '파일 다운로드' : '링크 열기'}
                        </a>
                        <span className="text-center text-[11px] text-[#7a6f68]">{material.fileName}</span>
                      </div>
                      <button
                        type="button"
                        className="self-start rounded-full bg-[#f5eee9] p-2 text-[#5c5c5c] transition-colors hover:bg-[#ffd331]/80"
                        onClick={() => handleDelete(material.notionId, 'material')}
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
      ) : null}

      {activeTab === 'classroomNotice' ? (
        <section className="flex flex-col gap-6">
          <form className="rounded-3xl bg-white p-6 shadow-md" onSubmit={handleClassroomNoticeSubmit}>
            <h3 className="mb-4 text-lg font-semibold text-[#404040]">강의실 공지 등록</h3>
            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="classNoticeTitle">
                  제목
                </label>
                <input
                  id="classNoticeTitle"
                  type="text"
                  className="rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  placeholder="공지 제목을 입력하세요"
                  value={classroomNoticeForm.title}
                  onChange={(event) => setClassroomNoticeForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#5c5c5c]" htmlFor="classNoticeContent">
                  내용
                </label>
                <textarea
                  id="classNoticeContent"
                  className="min-h-[120px] rounded-2xl border border-[#e9dccf] px-4 py-2 text-sm focus:border-[#ffd331] focus:outline-none"
                  placeholder="공지 내용을 입력하세요"
                  value={classroomNoticeForm.content}
                  onChange={(event) => setClassroomNoticeForm((prev) => ({ ...prev, content: event.target.value }))}
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#5c5c5c]">
                <input
                  type="checkbox"
                  checked={classroomNoticeForm.isImportant}
                  onChange={(event) =>
                    setClassroomNoticeForm((prev) => ({ ...prev, isImportant: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-[#e9dccf] text-[#ffd331] focus:ring-[#ffd331]"
                />
                중요 공지로 표시하기
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="rounded-2xl bg-[#ffd331] px-6 py-2 text-sm font-semibold text-[#404040] shadow-md transition-colors hover:bg-[#e6bd2c]"
              >
                저장
              </button>
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-semibold text-[#404040]">등록된 강의실 공지</h3>
            {filteredClassroomNotices.length === 0 ? (
              <p className="text-sm text-[#7a6f68]">해당 강좌에 등록된 공지가 없습니다.</p>
            ) : (
              <ul className="space-y-4">
                {filteredClassroomNotices.map((notice) => (
                  <li key={notice.id} className="rounded-2xl bg-[#f9f5f1] p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-semibold text-[#404040]">{notice.title}</h4>
                          {notice.isImportant ? (
                            <span className="rounded-full bg-[#ffd331] px-3 py-1 text-[10px] font-semibold text-[#404040]">
                              중요
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-[#5c5c5c]">{notice.content}</p>
                        <p className="mt-2 text-xs text-[#7a6f68]">{formatDisplayDate(notice.createdAt)}</p>
                      </div>
                      <button
                        type="button"
                        className="rounded-full bg-[#f5eee9] p-2 text-[#5c5c5c] transition-colors hover:bg-[#ffd331]/80"
                        onClick={() => handleDelete(notice.notionId, 'notice')}
                        aria-label="강의실 공지 삭제"
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
      ) : null}
    </div>
  );
};

export default ContentManager;
