import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  type ClassroomMaterial,
  type ClassroomNotice,
  type ClassroomVideo,
  getClassroomMaterials,
  getClassroomNotices,
  getClassroomVideos,
} from '../../lib/api/classroom';
import { supabase } from '@/lib/supabaseClient';

type TabKey = 'materials' | 'video' | 'notice' | 'assignment' | 'feedback';

type CourseMeta = {
  courseName: string;
  courseDescription?: string | null;
  categoryName?: string | null;
};

const tabs: { key: TabKey; label: string }[] = [
  { key: 'materials', label: '자료' },
  { key: 'video', label: '강의실 영상' },
  { key: 'notice', label: '강의실 공지' },
  { key: 'assignment', label: '과제' },
  { key: 'feedback', label: '피드백' },
];

function ClassDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<TabKey>('materials');
  const [courseMeta, setCourseMeta] = useState<CourseMeta | null>(null);
  const [courseVideos, setCourseVideos] = useState<ClassroomVideo[]>([]);
  const [courseMaterials, setCourseMaterials] = useState<ClassroomMaterial[]>([]);
  const [courseNotices, setCourseNotices] = useState<ClassroomNotice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const loadContent = async () => {
      setIsLoading(true);

      try {
        const [videos, materials, notices, classResult] = await Promise.all([
          getClassroomVideos(id),
          getClassroomMaterials(id),
          getClassroomNotices(id),
          supabase.from('classes').select('name, category, description').eq('id', id).maybeSingle(),
        ]);

        if (!isMounted) return;

        setCourseVideos(videos);
        setCourseMaterials(materials);
        setCourseNotices(notices);

        if (!classResult.error && classResult.data) {
          setCourseMeta({
            courseName: classResult.data.name ?? '과정 상세 정보',
            courseDescription: (classResult.data.description as string | null | undefined) ?? null,
            categoryName: (classResult.data.category as string | null | undefined) ?? null,
          });
        } else {
          setCourseMeta(null);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('[ClassDetailPage] failed to load classroom content', error);
        setCourseVideos([]);
        setCourseMaterials([]);
        setCourseNotices([]);
        setCourseMeta(null);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    void loadContent();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const renderVideoTab = () => (
    <section className="space-y-4">
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        {isLoading ? (
          <p className="text-sm text-ellieGray/70">강의 영상을 불러오는 중입니다...</p>
        ) : courseVideos.length > 0 ? (
          <div className="space-y-4">
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-ellieGray/10">
              <iframe
                src={courseVideos[0].url}
                title={`${courseMeta?.courseName ?? '강의실'} 영상`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-ellieGray">영상 리스트</h3>
              <ul className="space-y-2">
                {courseVideos.map((video) => (
                  <li key={video.id} className="rounded-2xl bg-[#fffaf0] px-4 py-3">
                    <p className="text-sm font-semibold text-ellieGray">{video.title}</p>
                    {video.description ? (
                      <p className="mt-1 text-xs text-ellieGray/70">{video.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ellieGray/70">등록된 콘텐츠가 없습니다.</p>
        )}
      </div>
    </section>
  );

  const renderNoticeTab = () => (
    <section className="space-y-4">
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-base font-semibold text-ellieGray">강의실 공지</h3>
        {isLoading ? (
          <p className="mt-3 text-sm text-ellieGray/70">강의실 공지를 불러오는 중입니다...</p>
        ) : courseNotices.length === 0 ? (
          <p className="mt-3 text-sm text-ellieGray/70">등록된 콘텐츠가 없습니다.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {courseNotices.map((notice) => (
              <li key={notice.id} className="rounded-2xl bg-[#fffaf0] p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ellieGray">{notice.title}</p>
                    {notice.isImportant ? (
                      <span className="rounded-full bg-[#ffd331] px-3 py-1 text-[10px] font-semibold text-ellieGray">중요</span>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ellieGray/70">{notice.content}</p>
                  <time className="text-xs text-ellieGray/60" dateTime={notice.createdAt}>
                    {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );

  const renderMaterialsTab = () => (
    <section className="space-y-4">
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-base font-semibold text-ellieGray">첨부자료</h3>
        {isLoading ? (
          <p className="mt-3 text-sm text-ellieGray/70">첨부자료를 불러오는 중입니다...</p>
        ) : courseMaterials.length === 0 ? (
          <p className="mt-3 text-sm text-ellieGray/70">등록된 콘텐츠가 없습니다.</p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm text-ellieGray/80">
            {courseMaterials.map((material) => (
              <li
                key={material.id}
                className="flex flex-col gap-3 rounded-2xl bg-[#fffaf0] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-ellieGray">{material.title}</p>
                  {material.description ? (
                    <p className="mt-1 text-xs text-ellieGray/70">{material.description}</p>
                  ) : null}
                  <time className="mt-2 block text-xs text-ellieGray/60" dateTime={material.createdAt}>
                    {new Date(material.createdAt).toLocaleDateString('ko-KR')}
                  </time>
                </div>
                <a
                  href={material.fileUrl}
                  target={material.fileType === 'link' ? '_blank' : undefined}
                  rel={material.fileType === 'link' ? 'noopener noreferrer' : undefined}
                  download={material.fileType === 'file' ? material.fileName : undefined}
                  className="inline-flex items-center justify-center rounded-full bg-[#ffd331] px-4 py-2 text-xs font-semibold text-ellieGray shadow-soft"
                >
                  {material.fileType === 'file' ? '다운로드' : '바로가기'}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );

  const renderFeedbackTab = () => (
    <section className="space-y-4">
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        {isLoading ? (
          <p className="text-sm text-ellieGray/70">피드백을 불러오는 중입니다...</p>
        ) : (
          <p className="text-sm text-ellieGray/70">등록된 콘텐츠가 없습니다.</p>
        )}
      </div>
    </section>
  );

  const renderAssignmentTab = () => (
    <section className="space-y-5">
      <div className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-base font-semibold text-ellieGray">과제 안내</h3>
        {isLoading ? (
          <p className="text-sm text-ellieGray/70">과제 정보를 불러오는 중입니다...</p>
        ) : (
          <p className="text-sm text-ellieGray/70">등록된 콘텐츠가 없습니다.</p>
        )}
      </div>

      <div className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-base font-semibold text-ellieGray">제출된 과제</h3>
        {isLoading ? (
          <p className="text-sm text-ellieGray/70">과제 제출 내역을 불러오는 중입니다...</p>
        ) : (
          <p className="text-sm text-ellieGray/70">등록된 콘텐츠가 없습니다.</p>
        )}
      </div>
    </section>
  );

  return (
    <section className="space-y-5">
      <div className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-2 text-xs font-semibold text-ellieGray/60 hover:text-ellieGray"
        >
          ← 목록으로 돌아가기
        </button>
        <h2 className="text-lg font-semibold text-ellieGray">{courseMeta?.courseName ?? '과정 상세 정보'}</h2>
        {courseMeta?.courseDescription ? (
          <p className="mt-2 text-sm text-ellieGray/70">{courseMeta.courseDescription}</p>
        ) : null}
        {courseMeta?.categoryName ? (
          <p className="mt-1 text-xs text-ellieGray/60">카테고리: {courseMeta.categoryName}</p>
        ) : null}
        {!courseMeta && !isLoading ? (
          <p className="mt-3 text-sm text-ellieGray/70">강좌 정보를 찾을 수 없습니다.</p>
        ) : null}
      </div>

      <nav className="sticky top-0 z-10 flex gap-2 rounded-3xl bg-white/90 p-2 shadow-soft backdrop-blur">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd331]/60 ${
                isActive ? 'bg-[#ffd331] text-ellieGray' : 'bg-[#fffdf6] text-ellieGray/70'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === 'materials' && renderMaterialsTab()}
      {activeTab === 'video' && renderVideoTab()}
      {activeTab === 'notice' && renderNoticeTab()}
      {activeTab === 'assignment' && renderAssignmentTab()}
      {activeTab === 'feedback' && renderFeedbackTab()}
    </section>
  );
}

export default ClassDetailPage;
