function MichinaFeedback() {
  return (
    <div className="space-y-4 text-ellieGray">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold">피드백 보기</h2>
        <p className="text-sm leading-relaxed text-ellieGray/80">
          제출한 과제에 대한 강사 피드백을 확인해보세요.
        </p>
      </header>
      <div className="rounded-2xl bg-white/70 px-5 py-6 text-center shadow-soft">
        <p className="text-sm leading-relaxed text-ellieGray/70">
          아직 등록된 피드백이 없습니다. 과제를 제출하면 담당 강사가 피드백을 남겨드릴 예정이에요.
        </p>
      </div>
    </div>
  );
}

export default MichinaFeedback;
