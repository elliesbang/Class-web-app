import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  filterMaterialsByCourse,
  filterNoticesByCourse,
  filterVideosByCourse,
  findCourseSummary,
} from '../../lib/contentLibrary';
import { useSheetsData } from '../../contexts/SheetsDataContext';

const tabs = [
  { key: 'video', label: '영상' },
  { key: 'notice', label: '공지' },
  { key: 'materials', label: '자료' },
  { key: 'feedback', label: '피드백' },
  { key: 'assignment', label: '과제' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

function ClassDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { contentCollections, lectureCourses, loading } = useSheetsData();
  const [activeTab, setActiveTab] = useState<TabKey>('video');

  const courseMeta = useMemo(() => (id ? findCourseSummary(lectureCourses, id) : null), [id, lectureCourses]);
  const courseTitle = courseMeta?.courseName ?? '과정 상세 정보';
  const courseVideos = useMemo(
    () => (id ? filterVideosByCourse(contentCollections.classroomVideos, id) : []),
    [contentCollections.classroomVideos, id],
  );
  const courseMaterials = useMemo(
    () => (id ? filterMaterialsByCourse(contentCollections.classroomMaterials, id) : []),
    [contentCollections.classroomMaterials, id],
  );
  const courseNotices = useMemo(
    () => (id ? filterNoticesByCourse(contentCollections.classroomNotices, id) : []),
    [contentCollections.classroomNotices, id],
  );
  const isLoading = loading && !courseMeta;

  const renderVideoTab = () => (
    <section className="space-y-4">
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        {isLoading ? (
          <p className="text-sm text-ellieGray/70">강의 영상을 불러오는 중입니다...</p>
        ) : courseVideos.length > 0 ? (
          <div className="space-y-4">
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-ellieGray/10">
              <iframe
                src={courseVideos[0].videoUrl}
                title={`${courseTitle} 영상`}
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
          <p className="text-sm text-ellieGray/70">등록된 강의실 영상이 없습니다.</p>
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
          <p className="mt-3 text-sm text-ellieGray/70">등록된 공지가 없습니다.</p>
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
          <p className="mt-3 text-sm text-ellieGray/70">등록된 자료가 없습니다.</p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm text-ellieGray/80">
            {courseMaterials.map((material) => (
              <li key={material.id} className="flex flex-col gap-3 rounded-2xl bg-[#fffaf0] p-4 sm:flex-row sm:items-center sm:justify-between">
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
        <p className="text-sm text-ellieGray/70">관리자 피드백이 여기에 표시됩니다.</p>
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-[#fffaf0] px-4 py-3 text-sm text-ellieGray/80">피드백 항목 1</div>
          <div className="rounded-2xl bg-[#fffaf0] px-4 py-3 text-sm text-ellieGray/80">피드백 항목 2</div>
        </div>
      </div>
    </section>
  );

  const renderAssignmentTab = () => (
    <section className="space-y-5">
      <div className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-base font-semibold text-ellieGray">과제 업로드</h3>
        <div className="space-y-4 rounded-2xl border border-dashed border-ellieGray/20 bg-[#fffaf0] p-5">
          <label className="flex w-full cursor-pointer justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-ellieGray shadow-soft">
            이미지 업로드
            <input type="file" className="hidden" />
          </label>
          <input
            type="url"
            placeholder="링크 입력"
            className="w-full rounded-full border border-ellieGray/20 bg-white px-5 py-2 text-sm text-ellieGray focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
          />
          <button
            type="button"
            className="w-full rounded-full bg-[#ffd331] px-5 py-2 text-sm font-semibold text-ellieGray shadow-soft"
          >
            과제 제출하기
          </button>
          <p className="text-xs text-ellieGray/60">이미지 또는 링크 형태로 과제를 제출하세요.</p>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-base font-semibold text-ellieGray">제출된 과제</h3>
        <p className="text-sm text-ellieGray/70">제출된 과제 내역은 추후 연동 예정입니다.</p>
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
        <h2 className="text-lg font-semibold text-ellieGray">{courseTitle}</h2>
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

      <nav className="flex gap-2 rounded-3xl bg-white p-2 shadow-soft">
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

      {activeTab === 'video' && renderVideoTab()}
      {activeTab === 'notice' && renderNoticeTab()}
      {activeTab === 'materials' && renderMaterialsTab()}
      {activeTab === 'feedback' && renderFeedbackTab()}
      {activeTab === 'assignment' && renderAssignmentTab()}
    </section>
  );
}

export default ClassDetailPage;
