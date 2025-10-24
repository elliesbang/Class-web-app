import { useState } from 'react';

function AssignmentTab({ courseId, courseName }) {
  const isFileUpload = courseId === 'earlchal';
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setSelectedFile(null);
      setFileInputKey((prev) => prev + 1);
      setIsSubmitting(false);
    }, 300);
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
      setLinkUrl('');
      setIsSubmitting(false);
    }, 300);
  };

  if (isFileUpload) {
    return (
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
    );
  }

  return (
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
  );
}

export default AssignmentTab;
