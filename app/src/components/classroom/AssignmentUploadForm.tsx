import React, { useMemo, useState } from 'react';

import { getSessionCount } from '@/lib/utils/getSessionCount';

type AssignmentUploadFormProps = {
  className: string;
  onSubmit: (values: {
    sessionNo: number;
    assignmentType: 'image' | 'link' | 'text';
    linkUrl?: string;
    textContent?: string;
    imageBase64?: string;
  }) => void;
  allowSubmission: boolean;
  submitting: boolean;
  submitError?: string;
  statusMessage?: string;
};

const AssignmentUploadForm = ({
  className,
  onSubmit,
  allowSubmission,
  submitting,
  submitError,
  statusMessage,
}: AssignmentUploadFormProps) => {
  const sessionCount = useMemo(() => getSessionCount(className), [className]);
  const [sessionNo, setSessionNo] = useState(1);
  const [assignmentType, setAssignmentType] = useState<'image' | 'link' | 'text'>('image');
  const [linkUrl, setLinkUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [imageName, setImageName] = useState('');

  const sessions = useMemo(() => Array.from({ length: sessionCount }, (_, idx) => idx + 1), [sessionCount]);

  React.useEffect(() => {
    if (sessionNo > sessionCount) {
      setSessionNo(1);
    }
  }, [sessionCount, sessionNo]);

  const canSubmit = useMemo(() => {
    if (assignmentType === 'image') return !!imageBase64;
    if (assignmentType === 'link') return !!linkUrl.trim();
    if (assignmentType === 'text') return !!textContent.trim();
    return false;
  }, [assignmentType, imageBase64, linkUrl, textContent]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowSubmission || !canSubmit) return;

    onSubmit({
      sessionNo,
      assignmentType,
      linkUrl,
      textContent,
      imageBase64,
    });
  };

  const resetFields = () => {
    setLinkUrl('');
    setTextContent('');
    setImageBase64('');
    setImageName('');
  };

  React.useEffect(() => {
    resetFields();
  }, [assignmentType]);

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white/70 px-5 py-6 shadow-soft space-y-4">
      <div>
        <h3 className="font-semibold text-ellieGray">과제 제출</h3>
        <p className="text-sm text-ellieGray/70">이미지, 링크 또는 텍스트로 제출하세요.</p>
      </div>

      {sessionCount > 1 && (
        <div className="flex gap-2 items-center">
          <label className="text-sm font-semibold">회차 선택</label>
          <select className="border rounded-xl px-3 py-2" value={sessionNo} onChange={(e) => setSessionNo(Number(e.target.value))}>
            {sessions.map((s) => (
              <option key={s} value={s}>
                {s}회차
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-3 text-sm font-semibold text-ellieGray">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="assignment_type"
            value="image"
            checked={assignmentType === 'image'}
            onChange={() => setAssignmentType('image')}
          />
          이미지
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="assignment_type"
            value="link"
            checked={assignmentType === 'link'}
            onChange={() => setAssignmentType('link')}
          />
          링크
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="assignment_type"
            value="text"
            checked={assignmentType === 'text'}
            onChange={() => setAssignmentType('text')}
          />
          텍스트
        </label>
      </div>

      {assignmentType === 'image' && (
        <div>
          <label className="text-sm font-semibold">이미지 업로드</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {imageName && <p className="text-xs">{imageName}</p>}
        </div>
      )}

      {assignmentType === 'link' && (
        <div>
          <label className="text-sm font-semibold">링크 제출</label>
          <input
            className="border rounded-xl px-3 py-2 w-full"
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
        </div>
      )}

      {assignmentType === 'text' && (
        <div>
          <label className="text-sm font-semibold">텍스트 제출</label>
          <textarea
            className="border rounded-xl px-3 py-2 w-full"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
          />
        </div>
      )}

      {submitError && <p className="text-red-500 text-sm">{submitError}</p>}
      {statusMessage && <p className="text-sm">{statusMessage}</p>}

      <button
        type="submit"
        disabled={submitting || !allowSubmission || !canSubmit}
        className="bg-[#ffd331] rounded-2xl px-4 py-2 font-semibold text-ellieGray shadow-soft w-full"
      >
        {submitting ? '제출 중...' : '제출하기'}
      </button>
    </form>
  );
};

export default AssignmentUploadForm;
