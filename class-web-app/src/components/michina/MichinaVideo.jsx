function MichinaVideo() {
  return (
    <div className="space-y-4 text-ellieGray">
      <div className="relative overflow-hidden rounded-2xl bg-black pt-[56.25%] shadow-soft">
        <iframe
          src="https://player.vimeo.com/video/76979871?h=8272103f6e"
          title="미치나 강의 영상"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">이번 주 학습 주제</h2>
        <p className="text-sm leading-relaxed text-ellieGray/80">
          생성형 AI를 활용한 스토리보드 제작 방법을 익혀보세요. 영상의 핵심 포인트를 참고해 실습을 진행하면
          더욱 효과적으로 이해할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

export default MichinaVideo;
