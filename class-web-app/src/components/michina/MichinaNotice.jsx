function MichinaNotice() {
  return (
    <div className="space-y-4 text-ellieGray">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold">공지사항</h2>
        <p className="text-sm leading-relaxed text-ellieGray/80">
          강의 운영에 필요한 최신 소식을 확인하세요.
        </p>
      </header>
      <div className="rounded-2xl bg-white/70 px-5 py-6 text-center shadow-soft">
        <p className="text-sm leading-relaxed text-ellieGray/70">
          아직 등록된 공지가 없습니다. 새로운 소식이 게시되면 알림을 통해 가장 먼저 안내드릴게요.
        </p>
      </div>
    </div>
  );
}

export default MichinaNotice;
