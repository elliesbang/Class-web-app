import { useState } from 'react';

function AssignmentTab({ courseId, courseName }) {
  const isFileUpload = courseId === 'earlchal';
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  if (isFileUpload) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
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
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-ellieGray/60">PNG, JPG, PDF, ZIP 형식 파일을 업로드할 수 있어요.</p>
          {selectedFile ? (
            <p className="text-xs font-semibold text-ellieGray">선택된 파일: {selectedFile.name}</p>
          ) : null}
        </div>

        <button
          type="submit"
          className="rounded-md bg-[#ffd331] px-4 py-2 text-sm font-semibold text-ellieGray shadow-soft transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ffd331]/60"
        >
          제출
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          onChange={(event) => setLinkUrl(event.target.value)}
          className="w-full rounded-md border border-gray-200 bg-white p-2 text-sm text-ellieGray focus:border-ellieYellow focus:outline-none focus:ring-2 focus:ring-ellieYellow/60"
        />
        <p className="text-xs text-ellieGray/60">
          제출 후에는 강의실에서 제출한 링크와 피드백을 확인할 수 있어요.
        </p>
      </div>

      <button
        type="submit"
        className="rounded-md bg-[#ffd331] px-4 py-2 text-sm font-semibold text-ellieGray shadow-soft transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ffd331]/60"
      >
        제출
      </button>
    </form>
  );
}

export default AssignmentTab;
