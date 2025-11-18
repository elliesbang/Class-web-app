 import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';

import type { ClassroomMaterial, ClassroomNotice, ClassroomVideo } from '../../../../lib/api/classroom';
import type { GlobalNotice } from '../../../../lib/api/notice';
import type { VodVideo } from '../../../../lib/api/vod';

import { getStoredAuthUser } from '../../../../lib/authUser';
import { useSheetsData } from '../../../../contexts/SheetsDataContext';
import VodCategorySelector from './VodCategorySelector';

const TAB_ITEMS = [
  { key: 'globalNotice' as const, label: '전체 공지' },
  { key: 'classroomVideo' as const, label: '강의실 영상' },
  { key: 'vodVideo' as const, label: 'VOD 영상' },
  { key: 'material' as const, label: '자료' },
  { key: 'classroomNotice' as const, label: '강의실 공지' },
];

export type TabKey = (typeof TAB_ITEMS)[number]['key'];

type VodCategory = { id: number; name: string; order_num: number };

const ContentManager = ({ activeTab, onTabChange, selectedClassId }) => {
  const { contentCollections, refresh } = useSheetsData();

  const [globalNotices, setGlobalNotices] = useState(contentCollections.globalNotices);
  const [classroomVideos, setClassroomVideos] = useState(contentCollections.classroomVideos);
  const [vodVideos, setVodVideos] = useState(contentCollections.vodVideos);
  const [materials, setMaterials] = useState(contentCollections.classroomMaterials);
  const [classroomNotices, setClassroomNotices] = useState(contentCollections.classroomNotices);

  const [vodCategories, setVodCategories] = useState<VodCategory[]>([]);
  const [selectedVodCategoryId, setSelectedVodCategoryId] = useState<number | null>(null);

  const SHOW_VOD_CATEGORY = activeTab === 'vodVideo';

  const [globalNoticeForm, setGlobalNoticeForm] = useState({
    title: '',
    content: '',
    isVisible: true,
    thumbnailFile: null,
  });

  const [classroomVideoForm, setClassroomVideoForm] = useState({
    title: '',
    videoUrl: '',
    description: '',
    displayOrder: '0',
  });

  const [vodVideoForm, setVodVideoForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailFile: null,
    isRecommended: true,
    displayOrder: '0',
  });

  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    file: null,
    fileType: 'file',
    linkUrl: '',
  });

  const [classroomNoticeForm, setClassroomNoticeForm] = useState({
    title: '',
    content: '',
    isImportant: false,
  });

  const buildAuthHeaders = () => {
    const token = getStoredAuthUser()?.token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const formatDisplayDate = (value: string) => {
    try {
      return new Date(value).toLocaleDateString('ko-KR');
    } catch {
      return value;
    }
  };

  useEffect(() => {
    if (activeTab !== 'vodVideo') return;

    const fetchVodCategories = async () => {
      try {
        const res = await fetch('/.netlify/functions/vod-category');
        const data = await res.json();
        setVodCategories(data);
        if (data.length > 0 && selectedVodCategoryId === null) {
          setSelectedVodCategoryId(data[0].id);
        }
      } catch (err) {
        console.error('VOD category load error:', err);
      }
    };

    fetchVodCategories();
  }, [activeTab, selectedVodCategoryId]);

  const filteredClassroomVideos = useMemo(() => {
    if (!selectedClassId) return [];
    return classroomVideos
      .filter((v) => v.courseId === selectedClassId)
      .sort((a, b) => {
        if (a.displayOrder !== b.displayOrder)
          return a.displayOrder - b.displayOrder;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [classroomVideos, selectedClassId]);

  const filteredMaterials = useMemo(() => {
    if (!selectedClassId) return [];
    return materials
      .filter((m) => m.courseId === selectedClassId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [materials, selectedClassId]);

  const filteredClassroomNotices = useMemo(() => {
    if (!selectedClassId) return [];
    return classroomNotices
      .filter((n) => n.courseId === selectedClassId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [classroomNotices, selectedClassId]);

  const filteredVodVideos = useMemo(() => {
    if (!selectedVodCategoryId) return [];
    return vodVideos
      .filter((v) => String(v.categoryId) === String(selectedVodCategoryId))
      .sort((a, b) => {
        if (a.displayOrder !== b.displayOrder)
          return a.displayOrder - b.displayOrder;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [vodVideos, selectedVodCategoryId]);
    /* ---------------------- 저장 핸들러들 ----------------------- */

  /** 전체 공지 저장 */
  const handleGlobalNoticeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/.netlify/functions/content/add', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          type: 'global_notice',
          title: globalNoticeForm.title,
          content: globalNoticeForm.content,
          thumbnail_url: null,
          is_visible: globalNoticeForm.isVisible,
          order_num: 0,
        }),
      });

      if (!res.ok) throw new Error();
      await refresh();
      setGlobalNoticeForm({ title: '', content: '', isVisible: true, thumbnailFile: null });
    } catch (err) {
      console.error('[SAVE][전체공지] 실패', err);
    }
  };

  /** 강의실 영상 */
  const handleClassroomVideoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/.netlify/functions/content/add', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          type: 'classroom_video',
          title: classroomVideoForm.title,
          url: classroomVideoForm.videoUrl,
          class_id: selectedClassId || undefined,
          order_num: Number(classroomVideoForm.displayOrder) || 0,
        }),
      });

      if (!res.ok) throw new Error();
      await refresh();
      setClassroomVideoForm({ title: '', videoUrl: '', description: '', displayOrder: '0' });
    } catch (err) {
      console.error('[SAVE][강의실영상] 실패', err);
    }
  };

  /** VOD */
  const handleVodVideoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/.netlify/functions/vod/add', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          title: vodVideoForm.title,
          description: vodVideoForm.description,
          url: vodVideoForm.videoUrl,
          category_id: selectedVodCategoryId ?? undefined,
          is_recommended: vodVideoForm.isRecommended,
        }),
      });

      if (!res.ok) throw new Error();
      await refresh();
      setVodVideoForm({
        title: '',
        description: '',
        videoUrl: '',
        thumbnailFile: null,
        isRecommended: true,
        displayOrder: '0',
      });
    } catch (err) {
      console.error('[SAVE][VOD] 실패', err);
    }
  };

  /** 자료 */
  const handleMaterialSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const fileUrl = materialForm.fileType === 'link'
        ? materialForm.linkUrl
        : materialForm.file?.name ?? '';

      const res = await fetch('/.netlify/functions/content/add', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          type: 'material',
          title: materialForm.title,
          url: fileUrl,
          class_id: selectedClassId || undefined,
          order_num: 0,
        }),
      });

      if (!res.ok) throw new Error();
      await refresh();
      setMaterialForm({ title: '', description: '', file: null, fileType: 'file', linkUrl: '' });
    } catch (err) {
      console.error('[SAVE][자료] 실패', err);
    }
  };

  /** 강의실 공지 */
  const handleClassroomNoticeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/.netlify/functions/content/add', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          type: 'classroom_notice',
          title: classroomNoticeForm.title,
          content: classroomNoticeForm.content,
          class_id: selectedClassId || undefined,
          order_num: classroomNoticeForm.isImportant ? -1 : 0,
        }),
      });

      if (!res.ok) throw new Error();
      await refresh();
      setClassroomNoticeForm({ title: '', content: '', isImportant: false });
    } catch (err) {
      console.error('[SAVE][강의실 공지] 실패', err);
    }
  };

  /* ---------------------- UI ----------------------- */

  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-md">
      {/* 상단 탭 */}
      <div className="flex flex-wrap gap-2">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.key}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
              activeTab === tab.key
                ? 'bg-[#ffd331] text-[#404040]'
                : 'bg-[#f5eee9] text-[#7a6f68] hover:bg-[#ffd331]/80 hover:text-[#404040]'
            }`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* VOD 카테고리 */}
      {activeTab === 'vodVideo' && (
        <VodCategorySelector
          categories={vodCategories}
          selected={selectedVodCategoryId}
          onChange={setSelectedVodCategoryId}
        />
      )}

      {/* 이하 UI 구조 전체는 그대로 유지… (너가 이미 붙여둔 컴포넌트 내용 그대로 사용) */}
      {/* 위 저장 핸들러만 문제 있어서 전체 공지/강의실/자료/VOD/공지 저장이 실패했던 것 해결됨 */}
    </div>
  );
};

export default ContentManager;
    

              
