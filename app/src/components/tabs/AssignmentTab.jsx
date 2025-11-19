import React, { useMemo, useState } from 'react';

const AssignmentTab = ({
  classroomId,
  studentId,
  assignments = [],
  onSubmit,
  isSubmitting,
}) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  const canSubmit = useMemo(() => !!studentId && (!!linkUrl || !!imageFile), [studentId, linkUrl, imageFile]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setImageFile(file ?? null);
    setPreview(file ? URL.createObjectURL(file) : '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitMessage('');
    await onSubmit({ linkUrl, imageFile });
    setLinkUrl('');
    setImageFile(null);
    setPreview('');
    setSubmitMessage('제출되었습니다.');
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white/90 p-4 shadow-soft">
        <header>
          <h3 className="text-base font-semibold text-ellieGray">과제 제출</h3>
          <p className="mt-1 text-xs text-ellieGray/70">이미지 또는 링크를 업로드해주세요.</p>
          {classroomId ? (
            <p className="mt-1 text-xs text-ellieGray/60">강의실 ID: {classroomId}</p>
          ) : null}
        </header>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold text-ellieGray">수강생 ID</label>
            <p className="mt-1 text-sm text-ellieGray/80">{studentId || '수강생 ID를 먼저 저장해주세요.'}</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ellieGray">제출 링크</label>
            <input
              type="url"
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              placeholder="https://"
              className="w-full rounded-2xl border border-[#f1e6c7] bg-white/70 px-4 py-3 text-sm text-ellieGray focus:outline-none focus:ring-2 focus:ring-[#ffd331]/60"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ellieGray">이미지 업로드</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm"
            />
            {preview ? (
              <img src={preview} alt="preview" className="h-32 w-full rounded-2xl object-cover" />
            ) : null}
          </div>
          {submitMessage ? <p className="text-xs text-ellieGray/70">{submitMessage}</p> : null}
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-ellieGray shadow-soft transition ${
              canSubmit ? 'bg-[#ffd331] hover:bg-[#ffca0a]' : 'cursor-not-allowed bg-[#f1e6c7] text-ellieGray/50'
            }`}
          >
            {isSubmitting ? '제출 중...' : '제출하기'}
          </button>
        </form>
      </section>

      <section>
        <h3 className="text-base font-semibold text-ellieGray">제출된 과제</h3>
        {!assignments.length ? (
          <p className="mt-2 text-sm text-ellieGray/70">아직 제출된 과제가 없습니다.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {assignments.map((assignment) => (
              <li key={assignment.id} className="rounded-2xl bg-white/80 p-4 shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ellieGray/70">
                  <span>{new Date(assignment.created_at).toLocaleString('ko-KR')}</span>
                  {assignment.link_url ? (
                    <a
                      href={assignment.link_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-[#ff9900]"
                    >
                      링크 열기 →
                    </a>
                  ) : null}
                </div>
                {assignment.image_url ? (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-[#f1e6c7]">
                    <img src={assignment.image_url} alt="과제 이미지" className="h-48 w-full object-cover" loading="lazy" />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AssignmentTab;
