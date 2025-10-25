import { useState } from 'react';
import { Trash2 } from 'lucide-react';

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes || 1) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** index;

  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)}${units[index]}`;
};

const formatSubmittedAt = (isoString) =>
  new Date(isoString).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

function AssignmentTab({ courseId, courseName }) {
  const isFileUpload = courseId === 'earlchal';
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [submittedLinks, setSubmittedLinks] = useState([]);

  const resetStatus = () => {
    setSubmitStatus(null);
  };

  const handleFileSubmit = (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!selectedFile) {
      setSubmitStatus({ type: 'error', message: '제출할 파일을 선택해주세요.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    window.setTimeout(() => {
      setSubmitStatus({
        type: 'success',
        message: `${courseName ?? '강의'} 과제가 업로드되었습니다. 담당 강사가 확인 후 피드백을 남겨드립니다.`,
      });
      setUploadedFiles((prev) => [
        {
          id: Date.now(),
          name: selectedFile.name,
          size: selectedFile.size,
          submittedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setSelectedFile(null);
      setFileInputKey((prev) => prev + 1);
      setIsSubmitting(false);
    }, 300);
  };

  const handleDeleteUploadedFile = (id) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleLinkSubmit = (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmed = linkUrl.trim();
    if (!trimmed) {
      setSubmitStatus({ type: 'error', message: '제출할 링크를 입력해주세요.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    window.setTimeout(() => {
      setSubmitStatus({
        type: 'success',
        message: `${courseName ?? '강의'} 과제 링크가 제출되었습니다. 담당 강사가 순차적으로 확인합니다.`,
      });
      setSubmittedLinks((prev) => [
        {
          id: Date.now(),
          url: trimmed,
          submittedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setLinkUrl('');
      setIsSubmitting(false);
    }, 300);
  };

  const handleDeleteSubmittedLink = (id) => {
    setSubmittedLinks((prev) => prev.filter((item) => item.id !== id));
  };

  if (isFileUpload) {
    return (
      <div className="space-y-6">
        <form onSubmit={handleFileSubmit} className="space-y-4">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-ellieGray">과제 업로드</h2>
            <p className="text-sm text-ellieGray/70">
              파일을 업로드하면 담당 강사가 확인 후 피드백을 남겨드립니다.
            </p>
          </header>

          <div className="space-y-2">
            <label htmlFor="assignmentFile" className="block text-sm font-semibold text-ellieGray">
              파일 선택
            </label>
            <input
              id="assignmentFile"
              type="file"
              accept=".png,.jpg,.jpeg,.pdf,.zip"
              className="w-full cursor-pointer rounded-md border border-gray-200 bg-white p-2 text-sm text-ellieGray focus:border-ellieYellow focus:outline-none focus:ring-2 focus:ring-ellieYellow/60"
              key={fileInputKey}
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] ?? null);
                resetStatus();
              }}
            />
            <p className="text-xs text-ellieGray/60">PNG, JPG, PDF, ZIP 형식 파일을 업로드할 수 있어요.</p>
            {selectedFile ? (
              <p className="text-xs font-semibold text-ellieGray">선택된 파일: {selectedFile.name}</p>
            ) : null}
          </div>

          {submitStatus ? (
            <p
              className={`rounded-md px-3 py-2 text-xs ${
                submitStatus.type === 'success'
                  ? 'border border-green-200 bg-green-50 text-green-700'
                  : 'border border-red-200 bg-red-50 text-red-600'
              }`}
            >
              {submitStatus.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-[#ffd331] px-4 py-2 text-sm font-semibold text-ellieGray shadow-soft transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ffd331]/60 disabled:cursor-not-allowed disabled:bg-[#ffd331]/60"
          >
            {isSubmitting ? '제출 중...' : '제출'}
          </button>
        </form>

        <section className="space-y-3 rounded-2xl border border-[#f0e6dc] bg-[#fdf8f2] p-4">
          <header>
            <h3 className="text-sm font-semibold text-ellieGray">제출한 파일</h3>
            <p className="text-xs text-ellieGray/70">최근 제출 순으로 정리돼요.</p>
          </header>

          {uploadedFiles.length > 0 ? (
            <ul className="space-y-2 text-sm text-ellieGray">
              {uploadedFiles.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{file.name}</p>
                    <p className="text-xs text-ellieGray/70">
                      {formatFileSize(file.size)} · {formatSubmittedAt(file.submittedAt)} 제출
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteUploadedFile(file.id)}
                    className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border border-transparent text-ellieGray/70 transition-colors duration-200 hover:border-ellieGray/20 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ellieYellow/60"
                    aria-label={`${file.name} 제출 기록 삭제`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-ellieGray/60">아직 제출된 파일이 없습니다. 파일을 업로드하면 이곳에 기록돼요.</p>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleLinkSubmit} className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-ellieGray">과제 링크 제출</h2>
          <p className="text-sm text-ellieGray/70">
            과제를 완성한 뒤 공유 가능한 링크를 입력하면 담당 강사가 확인합니다.
          </p>
        </header>

        <div className="space-y-2">
          <label htmlFor="assignmentLink" className="block text-sm font-semibold text-ellieGray">
            과제 링크 입력
          </label>
          <input
            id="assignmentLink"
            type="url"
            required
            placeholder="Canva, Google Drive 등 링크를 입력하세요"
            value={linkUrl}
            onChange={(event) => {
              setLinkUrl(event.target.value);
              resetStatus();
            }}
            className="w-full rounded-md border border-gray-200 bg-white p-2 text-sm text-ellieGray focus:border-ellieYellow focus:outline-none focus:ring-2 focus:ring-ellieYellow/60"
          />
          <p className="text-xs text-ellieGray/60">
            제출 후에는 강의실에서 제출한 링크와 피드백을 확인할 수 있어요.
          </p>
        </div>

        {submitStatus ? (
          <p
            className={`rounded-md px-3 py-2 text-xs ${
              submitStatus.type === 'success'
                ? 'border border-green-200 bg-green-50 text-green-700'
                : 'border border-red-200 bg-red-50 text-red-600'
            }`}
          >
            {submitStatus.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-[#ffd331] px-4 py-2 text-sm font-semibold text-ellieGray shadow-soft transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ffd331]/60 disabled:cursor-not-allowed disabled:bg-[#ffd331]/60"
        >
          {isSubmitting ? '제출 중...' : '제출'}
        </button>
      </form>

      <section className="space-y-3 rounded-2xl border border-[#f0e6dc] bg-[#fdf8f2] p-4">
        <header>
          <h3 className="text-sm font-semibold text-ellieGray">제출한 링크</h3>
          <p className="text-xs text-ellieGray/70">최근 제출 순으로 정리돼요.</p>
        </header>

        {submittedLinks.length > 0 ? (
          <ul className="space-y-2 text-sm text-ellieGray">
            {submittedLinks.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2"
              >
                <div className="min-w-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate font-semibold underline underline-offset-2"
                  >
                    {item.url}
                  </a>
                  <p className="text-xs text-ellieGray/70">{formatSubmittedAt(item.submittedAt)} 제출</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSubmittedLink(item.id)}
                  className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border border-transparent text-ellieGray/70 transition-colors duration-200 hover:border-ellieGray/20 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ellieYellow/60"
                  aria-label={`${item.url} 제출 기록 삭제`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-ellieGray/60">아직 제출한 링크가 없습니다. 제출하면 이곳에서 확인할 수 있어요.</p>
        )}
      </section>
    </div>
  );
}

export default AssignmentTab;
