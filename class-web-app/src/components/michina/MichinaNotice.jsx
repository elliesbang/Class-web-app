const notices = [
  {
    id: 1,
    title: '8월 2주차 라이브 Q&A 안내',
    date: '2024.08.12',
    summary: '이번 주 금요일 오후 8시에 라이브 Q&A가 진행됩니다. 사전 질문은 목요일까지 업로드해주세요.',
  },
  {
    id: 2,
    title: '과제 제출 마감 연장',
    date: '2024.08.09',
    summary: '요청에 따라 과제 제출 기한이 8월 13일 밤 11시 59분으로 연장되었습니다.',
  },
  {
    id: 3,
    title: '참고 자료 업데이트',
    date: '2024.08.07',
    summary: 'AI 스토리보드 예시 자료가 새롭게 추가되었습니다. 자료실에서 다운로드하세요.',
  },
];

function MichinaNotice() {
  return (
    <div className="space-y-4 text-ellieGray">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold">공지사항</h2>
        <p className="text-sm leading-relaxed text-ellieGray/80">
          강의 운영에 필요한 최신 소식을 확인하세요.
        </p>
      </header>
      <div className="space-y-3">
        {notices.map((notice) => (
          <article
            key={notice.id}
            className="rounded-2xl bg-ivory px-5 py-4 shadow-soft"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-base font-semibold leading-tight">{notice.title}</h3>
              <time className="text-xs text-ellieGray/60">{notice.date}</time>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ellieGray/80">{notice.summary}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default MichinaNotice;
