const notices = [
  {
    title: '5월 라이브 클래스 일정 안내',
    date: '2024.05.01',
    description: '캘리그라피와 창작 수업의 라이브 일정이 업데이트되었어요.',
  },
  {
    title: 'VOD 신규 콘텐츠 업로드',
    date: '2024.04.26',
    description: 'AI·콘텐츠 미치나 강의의 VOD 버전이 등록되었습니다.',
  },
  {
    title: '엘리의방 클래스 앱 업데이트',
    date: '2024.04.15',
    description: '모바일 앱 홈화면 바로가기 기능이 개선되었습니다.',
  },
];

function Notices() {
  return (
    <div className="space-y-4">
      <header className="rounded-3xl bg-white px-6 py-5 shadow-soft">
        <h1 className="text-xl font-bold text-ellieGray">공지사항</h1>
        <p className="mt-2 text-sm text-ellieGray/70">
          엘리의방 클래스의 새로운 소식과 업데이트를 확인하세요.
        </p>
      </header>
      <section className="space-y-4">
        {notices.map((notice) => (
          <article key={notice.title} className="rounded-3xl bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ellieGray">{notice.title}</h2>
              <time className="text-xs text-ellieGray/60">{notice.date}</time>
            </div>
            <p className="mt-2 text-sm text-ellieGray/70">{notice.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Notices;
