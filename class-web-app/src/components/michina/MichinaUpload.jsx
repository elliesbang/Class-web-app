import { useRef, useState } from 'react';

function MichinaUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setStatus(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setStatus({ type: 'error', message: '업로드할 파일을 선택해주세요.' });
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      setStatus({
        type: 'success',
        message: '과제 파일이 업로드되었습니다. 담당 강사가 확인 후 피드백을 남겨드립니다.',
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsSubmitting(false);
    }, 350);
  };

  return (
    <form className="space-y-5 text-ellieGray" onSubmit={handleSubmit}>
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
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="sr-only"
          onChange={handleFileChange}
        />
        <span className="rounded-full bg-ellieYellow px-5 py-2 text-sm font-semibold text-ellieGray shadow-soft">
          파일 선택하기
        </span>
        {selectedFile ? (
          <p className="text-xs font-medium text-ellieGray/70">선택된 파일: {selectedFile.name}</p>
        ) : null}
      </label>
      {status ? (
        <p
          className={`rounded-2xl px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}
        >
          {status.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-ellieGray px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-ellieGray/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ellieYellow/80 disabled:cursor-not-allowed disabled:bg-ellieGray/60"
      >
        {isSubmitting ? '업로드 중...' : '업로드 완료하기'}
      </button>
    </form>
  );
}

export default MichinaUpload;
