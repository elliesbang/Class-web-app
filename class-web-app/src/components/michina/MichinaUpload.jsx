function MichinaUpload() {
  return (
    <form className="space-y-5 text-ellieGray">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">과제 업로드</h2>
        <p className="text-sm leading-relaxed text-ellieGray/80">
          완성한 작업물을 PNG 또는 JPG 형식으로 업로드해주세요. 파일은 최대 10MB까지 지원됩니다.
        </p>
      </div>
      <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ellieYellow/60 bg-ivory px-6 py-10 text-center text-sm">
        <span className="font-semibold">이미지 파일 끌어다 놓기</span>
        <span className="text-ellieGray/60">또는 아래 버튼을 눌러 파일을 선택하세요.</span>
        <input
          type="file"
          accept="image/png,image/jpeg"
          className="sr-only"
        />
        <span className="rounded-full bg-ellieYellow px-5 py-2 text-sm font-semibold text-ellieGray shadow-soft">
          파일 선택하기
        </span>
      </label>
      <button
        type="submit"
        className="w-full rounded-full bg-ellieGray px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-ellieGray/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ellieYellow/80"
      >
        업로드 완료하기
      </button>
    </form>
  );
}

export default MichinaUpload;
