function MichinaVideo() {
  return (
    <div className="space-y-4 text-ellieGray">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/70 p-8 text-center shadow-soft">
        <span className="text-3xl" aria-hidden="true">
          🎬
        </span>
        <h2 className="text-lg font-semibold">등록된 영상이 없습니다</h2>
        <p className="text-sm leading-relaxed text-ellieGray/70">
          미치나 클래스 영상은 준비 중입니다. 새로운 학습 콘텐츠가 공개되면 가장 먼저 이곳에서 확인하실 수 있어요.
        </p>
      </div>
    </div>
  );
}

export default MichinaVideo;
