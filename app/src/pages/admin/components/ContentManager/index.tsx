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

  // -------------------- FETCH VOD CATEGORY -----------------------
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

  // -------------------- SUBMIT HANDLERS -----------------------

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

      await refresh();
      setGlobalNoticeForm({ title: '', content: '', isVisible: true, thumbnailFile: null });
    } catch (err) {
      console.error(err);
    }
  };

  const handleClassroomVideoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/.netlify/functions/content/add', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          type: 'classroom_video',
          title: classroomVideoForm.title,
          url: classroomVideoForm.videoUrl,
          class_id: selectedClassId,
          order_num: Number(classroomVideoForm.displayOrder),
        }),
      });

      await refresh();
      setClassroomVideoForm({ title: '', videoUrl: '', description: '', displayOrder: '0' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleVodVideoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/.netlify/functions/vod/add', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          title: vodVideoForm.title,
          description: vodVideoForm.description,
          url: vodVideoForm.videoUrl,
          category_id: selectedVodCategoryId,
          is_recommended: vodVideoForm.isRecommended,
        }),
      });

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
      console.error(err);
    }
  };

  const handleMaterialSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const fileUrl =
      materialForm.fileType === 'link'
        ? materialForm.linkUrl
        : materialForm.file?.name ?? '';

    try {
      await fetch('/.netlify/functions/content/add', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          type: 'material',
          title: materialForm.title,
          url: fileUrl,
          class_id: selectedClassId,
          order_num: 0,
        }),
      });

      await refresh();
      setMaterialForm({ title: '', description: '', file: null, fileType: 'file', linkUrl: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleClassroomNoticeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/.netlify/functions/content/add', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          type: 'classroom_notice',
          title: classroomNoticeForm.title,
          content: classroomNoticeForm.content,
          class_id: selectedClassId,
          order_num: classroomNoticeForm.isImportant ? -1 : 0,
        }),
      });

      await refresh();
      setClassroomNoticeForm({ title: '', content: '', isImportant: false });
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------- RENDER -----------------------

  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-md">
      <div className="flex flex-wrap gap-2">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.key}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
              activeTab === tab.key ? 'bg-[#ffd331]' : 'bg-[#f5eee9]'
            }`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'vodVideo' && (
        <VodCategorySelector
          categories={vodCategories}
          selected={selectedVodCategoryId}
          onChange={setSelectedVodCategoryId}
        />
      )}

      {/* globalNotice */}
      {activeTab === 'globalNotice' && (
        <form onSubmit={handleGlobalNoticeSubmit} className="flex flex-col gap-4">
          <input
            className="border rounded px-3 py-2"
            placeholder="제목"
            value={globalNoticeForm.title}
            onChange={(e) =>
              setGlobalNoticeForm((p) => ({ ...p, title: e.target.value }))
            }
          />
          <textarea
            className="border rounded px-3 py-2"
            placeholder="내용"
            value={globalNoticeForm.content}
            onChange={(e) =>
              setGlobalNoticeForm((p) => ({ ...p, content: e.target.value }))
            }
          />
          <button className="rounded-full bg-ellieYellow px-4 py-2 font-bold">저장</button>
        </form>
      )}

      {/* classroomVideo */}
      {activeTab === 'classroomVideo' && (
        <form onSubmit={handleClassroomVideoSubmit} className="flex flex-col gap-4">
          <input
            className="border rounded px-3 py-2"
            placeholder="제목"
            value={classroomVideoForm.title}
            onChange={(e) =>
              setClassroomVideoForm((p) => ({ ...p, title: e.target.value }))
            }
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="영상 URL"
            value={classroomVideoForm.videoUrl}
            onChange={(e) =>
              setClassroomVideoForm((p) => ({ ...p, videoUrl: e.target.value }))
            }
          />

          <button className="rounded-full bg-ellieYellow px-4 py-2 font-bold">저장</button>
        </form>
      )}

      {/* VOD */}
      {activeTab === 'vodVideo' && (
        <form onSubmit={handleVodVideoSubmit} className="flex flex-col gap-4">
          <input
            className="border rounded px-3 py-2"
            placeholder="제목"
            value={vodVideoForm.title}
            onChange={(e) =>
              setVodVideoForm((p) => ({ ...p, title: e.target.value }))
            }
          />
          <textarea
            className="border rounded px-3 py-2"
            placeholder="설명"
            value={vodVideoForm.description}
            onChange={(e) =>
              setVodVideoForm((p) => ({ ...p, description: e.target.value }))
            }
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="영상 URL"
            value={vodVideoForm.videoUrl}
            onChange={(e) =>
              setVodVideoForm((p) => ({ ...p, videoUrl: e.target.value }))
            }
          />
          <button className="rounded-full bg-ellieYellow px-4 py-2 font-bold">저장</button>
        </form>
      )}

      {/* material */}
      {activeTab === 'material' && (
        <form onSubmit={handleMaterialSubmit} className="flex flex-col gap-4">
          <input
            className="border rounded px-3 py-2"
            placeholder="자료 제목"
            value={materialForm.title}
            onChange={(e) =>
              setMaterialForm((p) => ({ ...p, title: e.target.value }))
            }
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="링크"
            value={materialForm.linkUrl}
            onChange={(e) =>
              setMaterialForm((p) => ({ ...p, linkUrl: e.target.value }))
            }
          />
          <button className="rounded-full bg-ellieYellow px-4 py-2 font-bold">저장</button>
        </form>
      )}

      {/* classroomNotice */}
      {activeTab === 'classroomNotice' && (
        <form onSubmit={handleClassroomNoticeSubmit} className="flex flex-col gap-4">
          <input
            className="border rounded px-3 py-2"
            placeholder="제목"
            value={classroomNoticeForm.title}
            onChange={(e) =>
              setClassroomNoticeForm((p) => ({ ...p, title: e.target.value }))
            }
          />
          <textarea
            className="border rounded px-3 py-2"
            placeholder="내용"
            value={classroomNoticeForm.content}
            onChange={(e) =>
              setClassroomNoticeForm((p) => ({ ...p, content: e.target.value }))
            }
          />
          <button className="rounded-full bg-ellieYellow px-4 py-2 font-bold">저장</button>
        </form>
      )}
    </div>
  );
};

export default ContentManager;
