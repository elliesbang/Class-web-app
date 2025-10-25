import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

const STORAGE_KEY = 'michina-upload-history';

const createSubmissionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getInitialSubmissions = () => {
  if (typeof window === 'undefined') return [];
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (!storedValue) return [];
    const parsed = JSON.parse(storedValue);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.error('Failed to parse Michina upload history from storage.', error);
    return [];
  }
};

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  const sizeInMb = bytes / (1024 * 1024);
  if (sizeInMb >= 1) {
    return `${sizeInMb.toFixed(1)}MB`;
  }
  return `${Math.max(bytes / 1024, 1).toFixed(0)}KB`;
};

const formatSubmittedAt = (submittedAt) => {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(submittedAt));
  } catch (error) {
    return submittedAt;
  }
};

function MichinaUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState(getInitialSubmissions);
  const fileInputRef = useRef(null);

  const persistSubmissions = (updater) => {
    setSubmissions((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

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
      const newSubmission = {
        id: createSubmissionId(),
        fileName: selectedFile.name,
        fileSize: selectedFile.size ?? 0,
        submittedAt: new Date().toISOString(),
      };
      persistSubmissions((prev) => [newSubmission, ...prev]);
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

  const handleDeleteSubmission = (submissionId) => {
    persistSubmissions((prev) => prev.filter((submission) => submission.id !== submissionId));
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
      <div className="space-y-3 rounded-2xl bg-white/70 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ellieGray">업로드 내역</h3>
          <span className="text-xs text-ellieGray/60">최근 순으로 정렬됩니다.</span>
        </div>
        {submissions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ellieGray/20 bg-white px-4 py-5 text-center text-xs text-ellieGray/60">
            아직 업로드한 파일이 없습니다. 과제 파일을 업로드하면 이곳에 기록돼요.
          </p>
        ) : (
          <ul className="space-y-2">
            {submissions.map((submission) => (
              <li
                key={submission.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-ellieGray/10 bg-white px-4 py-3 shadow-[0_4px_12px_rgba(188,163,138,0.08)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ellieGray">{submission.fileName}</p>
                  <p className="text-xs text-ellieGray/60">
                    {formatFileSize(submission.fileSize)} · {formatSubmittedAt(submission.submittedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSubmission(submission.id)}
                  className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border border-transparent text-ellieGray/70 transition-colors duration-200 hover:border-ellieGray/20 hover:bg-ivory hover:text-ellieGray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ellieYellow/80"
                  aria-label={`${submission.fileName} 업로드 삭제`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </form>
  );
}

export default MichinaUpload;
