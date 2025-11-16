import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthUser } from '../hooks/useAuthUser';
import NoticeTab from '../components/tabs/NoticeTab';
import VideoTab from '../components/tabs/VideoTab';
import MaterialTab from '../components/tabs/MaterialTab';
import AssignmentTab from '../components/tabs/AssignmentTab';
import FeedbackTab from '../components/tabs/FeedbackTab';

const TAB_CONFIG = [
  { id: 'notice', label: '공지', Component: NoticeTab },
  { id: 'video', label: '영상', Component: VideoTab },
  { id: 'material', label: '자료', Component: MaterialTab },
  { id: 'assignment', label: '과제', Component: AssignmentTab },
  { id: 'feedback', label: '피드백', Component: FeedbackTab },
];

const TYPE_TO_TAB = {
  global_notice: 'notice',
  classroom_notice: 'notice',
  lecture_video: 'video',
  vod: 'video',
  material: 'material',
};

const CLASSROOM_LABELS = {
  candyma: '캔디마',
  earlchal: '이얼챌',
  candyup: '캔디업',
  jungcalup: '중캘업',
  cangoods: '캔굿즈',
  calgoods: '캘굿즈',
  eggjak: '에그작',
  eggjakchal: '에그작챌',
  nacoljak: '나컬작',
  nacoljakchal: '나컬작챌',
  michina: '미치나',
};

const STUDENT_STORAGE_KEY = 'class-web-app:studentId';

const getStoredStudentId = () => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STUDENT_STORAGE_KEY) ?? '';
};

const storeStudentId = (value) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STUDENT_STORAGE_KEY, value ?? '');
};

const createDataBuckets = () => ({
  notice: [],
  video: [],
  material: [],
});

function ClassroomDetail() {
  const { id: classroomId = '' } = useParams();
  const navigate = useNavigate();
  const authUser = useAuthUser();
  const [activeTab, setActiveTab] = useState('notice');
  const [contents, setContents] = useState(createDataBuckets());
  const [assignments, setAssignments] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [studentId, setStudentId] = useState(getStoredStudentId);
  const [studentIdDraft, setStudentIdDraft] = useState(getStoredStudentId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authUser?.role === 'student') {
      setStudentId(authUser.user_id);
      setStudentIdDraft(authUser.user_id);
      return;
    }
    setStudentIdDraft(getStoredStudentId());
  }, [authUser]);

  useEffect(() => {
    setStudentIdDraft(studentId);
  }, [studentId]);

  useEffect(() => {
    storeStudentId(studentId);
  }, [studentId]);

  useEffect(() => {
    if (!classroomId) {
      return;
    }
    const controller = new AbortController();
    const loadContents = async () => {
      setIsLoadingContent(true);
      setError('');
      try {
        const response = await fetch(`/api/content/list?classroom_id=${classroomId}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('콘텐츠를 불러오지 못했습니다.');
        }
        const payload = await response.json();
        const data = Array.isArray(payload) ? payload : [];
        const nextBuckets = createDataBuckets();
        data.forEach((item) => {
          const tabKey = TYPE_TO_TAB[item.type];
          if (tabKey && nextBuckets[tabKey]) {
            nextBuckets[tabKey].push(item);
          }
        });
        setContents(nextBuckets);
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

    loadContents();

    return () => controller.abort();
  }, [classroomId]);

  const fetchAssignments = async (currentStudentId = studentId) => {
    if (!currentStudentId || !classroomId) {
      setAssignments([]);
      return;
    }
    try {
      const query = new URLSearchParams({
        classroom_id: classroomId,
        student_id: currentStudentId,
      });
      const response = await fetch(`/api/assignment/list?${query.toString()}`);
      if (!response.ok) {
        throw new Error('과제 목록을 불러오지 못했습니다.');
      }
      const payload = await response.json();
      setAssignments(Array.isArray(payload) ? payload : []);
    } catch (assignmentError) {
      console.error(assignmentError);
    }
  };

  const fetchFeedback = async (currentStudentId = studentId) => {
    if (!currentStudentId || !classroomId) {
      setFeedback([]);
      return;
    }
    try {
      const query = new URLSearchParams({
        classroom_id: classroomId,
        student_id: currentStudentId,
      });
      const response = await fetch(`/api/feedback/list?${query.toString()}`);
      if (!response.ok) {
        throw new Error('피드백을 불러오지 못했습니다.');
      }
      const payload = await response.json();
      setFeedback(Array.isArray(payload) ? payload : []);
    } catch (feedbackError) {
      console.error(feedbackError);
    }
  };

  useEffect(() => {
    if (!studentId) {
      setAssignments([]);
      setFeedback([]);
      return;
    }
    fetchAssignments(studentId);
    fetchFeedback(studentId);
  }, [studentId, classroomId]);

  const uploadImageToStorage = async (file) => {
    if (!file) return '';
    const endpoint = import.meta.env.VITE_IMAGE_UPLOAD_ENDPOINT;
    const token = import.meta.env.VITE_IMAGE_UPLOAD_TOKEN;
    if (endpoint) {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      if (!response.ok) {
        throw new Error('이미지 업로드 실패');
      }
      const payload = await response.json();
      return payload?.result?.variants?.[0] ?? payload?.imageUrl ?? payload?.url ?? '';
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result?.toString() ?? '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAssignmentSubmit = async ({ linkUrl, imageFile }) => {
    if (!studentId || !classroomId) {
      return;
    }
    setIsSubmittingAssignment(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadImageToStorage(imageFile);
      }
      const response = await fetch('/api/assignment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroom_id: classroomId,
          link_url: linkUrl || null,
          image_url: imageUrl || null,
        }),
      });
      if (!response.ok) {
        throw new Error('과제 제출에 실패했습니다.');
      }
      await response.json();
      await fetchAssignments(studentId);
      await fetchFeedback(studentId);
    } catch (submitError) {
      console.error(submitError);
      alert(submitError.message);
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  const activeTabConfig = useMemo(
    () => TAB_CONFIG.find((tab) => tab.id === activeTab) ?? TAB_CONFIG[0],
    [activeTab]
  );

  const ActiveComponent = activeTabConfig.Component;

  const classroomName = CLASSROOM_LABELS[classroomId] || classroomId;

  if (!classroomId) {
    return (
      <div className="min-h-screen bg-[#fffdf6] p-6 text-center text-ellieGray">
        <p>강의실 ID가 올바르지 않습니다.</p>
      </div>
    );
  }

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
          <h1 className="mt-1 text-2xl font-bold">{classroomName}</h1>
          <p className="mt-2 text-sm text-ellieGray/70">
            공지, 영상, 자료, 과제, 피드백을 한 번에 확인하세요.
          </p>
        </header>

        <section className="rounded-3xl bg-white px-6 py-5 shadow-soft">
          <p className="text-sm font-semibold text-ellieGray">내 수강생 ID</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={studentIdDraft}
              onChange={(event) => setStudentIdDraft(event.target.value)}
              placeholder="예: ellie-001"
              className="flex-1 rounded-2xl border border-[#f1e6c7] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffd331]/60"
            />
            <button
              type="button"
              className="rounded-2xl bg-[#ffd331] px-4 py-3 text-sm font-semibold text-ellieGray shadow-soft"
              onClick={() => setStudentId(studentIdDraft.trim())}
            >
              저장
            </button>
          </div>
          <p className="mt-2 text-xs text-ellieGray/60">
            과제 및 피드백 탭은 수강생 ID로 데이터를 불러옵니다.
          </p>
        </section>

        <nav className="sticky top-0 z-10 rounded-3xl bg-white/90 p-2 shadow-soft backdrop-blur">
          <ul className="flex flex-wrap gap-2">
            {TAB_CONFIG.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <li key={tab.id} className="min-w-[96px] flex-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-[#ffd331] text-ellieGray shadow-soft'
                        : 'bg-transparent text-ellieGray/60 hover:bg-[#fff6d3]'
                    }`}
                  >
                    {tab.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section className="rounded-3xl bg-white/90 p-6 shadow-soft">
          {isLoadingContent && activeTab !== 'assignment' && activeTab !== 'feedback' ? (
            <p className="text-sm text-ellieGray/70">콘텐츠를 불러오는 중입니다...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : (
            <ActiveComponent
              items={contents[activeTab]}
              notices={contents.notice}
              videos={contents.video}
              materials={contents.material}
              assignments={assignments}
              feedback={feedback}
              classroomId={classroomId}
              studentId={studentId}
              onSubmit={handleAssignmentSubmit}
              isSubmitting={isSubmittingAssignment}
            />
          )}
        </section>
      </div>
    </div>
  );
}

export default ClassroomDetail;
