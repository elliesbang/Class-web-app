import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const tabs = [
  { key: 'video', label: '영상' },
  { key: 'materials', label: '자료' },
  { key: 'feedback', label: '피드백' },
  { key: 'assignment', label: '과제' },
];

function ClassDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState(tabs[0].key);

  const courseTitle = useMemo(() => {
    if (!id) {
      return '과정 상세 정보';
    }

    try {
      return decodeURIComponent(id);
    } catch (error) {
      console.error('강의 타이틀 디코딩 실패', error);
      return id;
    }
  }, [id]);

  const renderVideoTab = () => (
    <section className="space-y-4">
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <div className="aspect-video w-full rounded-2xl bg-ellieGray/10" />
        <p className="mt-4 text-sm text-ellieGray/70">강의 영상이 이 영역에 표시됩니다.</p>
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-base font-semibold text-ellieGray">영상 리스트</h3>
        <ul className="mt-4 space-y-3 text-sm text-ellieGray/80">
          <li className="rounded-2xl bg-[#fffaf0] px-4 py-3">영상 항목 1</li>
          <li className="rounded-2xl bg-[#fffaf0] px-4 py-3">영상 항목 2</li>
          <li className="rounded-2xl bg-[#fffaf0] px-4 py-3">영상 항목 3</li>
        </ul>
      </div>
    </section>
  );

  const renderMaterialsTab = () => (
    <section className="space-y-4">
      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-base font-semibold text-ellieGray">첨부파일 목록</h3>
        <ul className="mt-4 space-y-3 text-sm text-ellieGray/80">
          <li className="flex items-center justify-between rounded-2xl bg-[#fffaf0] px-4 py-3">
            <span>자료 파일 1</span>
            <button
              type="button"
              className="rounded-full bg-[#ffd331] px-4 py-2 text-xs font-semibold text-ellieGray shadow-soft"
            >
              다운로드
            </button>
          </li>
          <li className="flex items-center justify-between rounded-2xl bg-[#fffaf0] px-4 py-3">
            <span>자료 파일 2</span>
            <button
              type="button"
              className="rounded-full bg-[#ffd331] px-4 py-2 text-xs font-semibold text-ellieGray shadow-soft"
            >
              다운로드
            </button>
          </li>
        </ul>
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
        <div className="space-y-4">
          <div className="rounded-2xl border border-ellieGray/10 bg-[#fffaf0] p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-2xl bg-white shadow-soft" />
                <div>
                  <p className="text-sm font-semibold text-ellieGray">이미지 과제 예시</p>
                  <p className="text-xs text-ellieGray/60">제출 시간: 2024-01-01 12:00</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ellieGray shadow-soft">
                  수정
                </button>
                <button type="button" className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ellieGray shadow-soft">
                  삭제
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3 rounded-2xl bg-white p-4 shadow-soft">
              <h4 className="text-sm font-semibold text-ellieGray">과제 수정</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <span className="text-xs font-medium text-ellieGray/70">기존 이미지</span>
                  <div className="h-20 w-full rounded-2xl bg-ellieGray/10" />
                  <label className="flex w-full cursor-pointer justify-center rounded-full bg-[#ffd331] px-4 py-2 text-xs font-semibold text-ellieGray shadow-soft">
                    새 이미지 업로드
                    <input type="file" className="hidden" />
                  </label>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium text-ellieGray/70">기존 링크</span>
                  <input
                    type="url"
                    defaultValue="https://example.com"
                    className="w-full rounded-full border border-ellieGray/20 bg-[#fffdf6] px-4 py-2 text-xs text-ellieGray focus:outline-none focus:ring-2 focus:ring-[#ffd331]/40"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" className="flex-1 rounded-full bg-[#ffd331] px-4 py-2 text-xs font-semibold text-ellieGray shadow-soft">
                    저장
                  </button>
                  <button type="button" className="flex-1 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ellieGray shadow-soft">
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ellieGray/10 bg-[#fffaf0] p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-ellieGray shadow-soft">
                  🔗
                </div>
                <div>
                  <p className="text-sm font-semibold text-ellieGray">링크 과제 예시</p>
                  <p className="text-xs text-ellieGray/60">제출 시간: 2024-01-02 15:30</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ellieGray shadow-soft">
                  수정
                </button>
                <button type="button" className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ellieGray shadow-soft">
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-soft">
          <p className="text-sm font-semibold text-ellieGray">삭제 확인</p>
          <p className="mt-2 text-xs text-ellieGray/60">과제를 삭제하시겠습니까?</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="flex-1 rounded-full bg-[#ffd331] px-4 py-2 text-xs font-semibold text-ellieGray shadow-soft">
              확인
            </button>
            <button type="button" className="flex-1 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ellieGray shadow-soft">
              취소
            </button>
          </div>
        </div>

        <p className="text-xs text-ellieGray/50">제출된 과제는 관리자 대시보드에서 확인 및 피드백 가능합니다.</p>
      </div>
    </section>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'video':
        return renderVideoTab();
      case 'materials':
        return renderMaterialsTab();
      case 'feedback':
        return renderFeedbackTab();
      case 'assignment':
        return renderAssignmentTab();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf6] text-ellieGray">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
        <div>
          <button
            type="button"
            onClick={() => navigate('/internal')}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-ellieGray shadow-soft"
          >
            뒤로가기(강의실로 돌아가기)
          </button>
        </div>

        <header className="rounded-3xl bg-[#fef568] px-6 py-6 shadow-soft">
          <h1 className="text-2xl font-bold text-ellieGray">{courseTitle}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ellieGray/70">
            영상, 자료, 피드백, 과제를 탭에서 선택해 확인하세요.
          </p>
        </header>

        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-[120px] rounded-full px-5 py-2 text-sm font-semibold shadow-soft transition-colors duration-200 ${
                  isActive ? 'bg-[#ffd331] text-ellieGray' : 'bg-white text-ellieGray/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {renderTabContent()}
      </div>
    </div>
  );
}

export default ClassDetailPage;
