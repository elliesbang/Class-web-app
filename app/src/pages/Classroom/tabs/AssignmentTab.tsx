import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { getStoredAuthUser } from '@/lib/authUser';

type AssignmentRecord = {
  id: string;
  classroom_id?: string;
  student_id?: string;
  session_no?: number;
  image_url?: string | null;
  link_url?: string | null;
  created_at?: string;
};

type AssignmentTabProps = {
  classId: string;
};

const SESSION_OPTIONS = Array.from({ length: 15 }, (_, index) => String(index + 1));

const formatDateTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

function AssignmentTab({ classId }: AssignmentTabProps) {
  const authUser = useMemo(() => getStoredAuthUser(), []);
  const [sessionNo, setSessionNo] = useState<string>(SESSION_OPTIONS[0]);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [imageName, setImageName] = useState('');
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [listError, setListError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadAssignments = useCallback(async () => {
    if (!classId) {
      setAssignments([]);
      return;
    }

    setLoadingList(true);
    setListError('');

    try {
      const query = new URLSearchParams({ class_id: classId, tab: 'assignment' });
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authUser?.token) {
        headers.Authorization = `Bearer ${authUser.token}`;
      }
      const response = await fetch(`/.netlify/functions/classroom-content?${query.toString()}`, { headers });
      if (!response.ok) {
        throw new Error(`Failed to load assignments. status=${response.status}`);
      }
      const payload = await response.json();
      setAssignments(Array.isArray(payload) ? payload : []);
    } catch (error: any) {
      console.error('[AssignmentTab] Failed to fetch assignments', error);
      setListError('과제 목록을 불러오는 중 문제가 발생했습니다.');
      setAssignments([]);
    } finally {
      setLoadingList(false);
    }
  }, [authUser?.token, classId]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageBase64('');
      setImageName('');
      return;
    }

    setImageName(file.name);

    const arrayBuffer = await file.arrayBuffer();
    const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    setImageBase64(`data:${file.type};base64,${base64String}`);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');
    setStatusMessage('');

    if (!authUser) {
      setSubmitError('로그인이 필요합니다.');
      return;
    }

    if (!classId) {
      setSubmitError('유효한 강의실 정보가 없습니다.');
      return;
    }

    const trimmedLink = linkUrl.trim();
    if (!imageBase64 && !trimmedLink) {
      setSubmitError('이미지 또는 링크 중 하나 이상을 제출해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, any> = {
        classroom_id: classId,
        student_id: authUser.user_id,
        session_no: Number(sessionNo),
        image_base64: imageBase64 || undefined,
        link_url: trimmedLink || undefined,
      };

      const response = await fetch('/.netlify/functions/assignment/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authUser.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || '과제 제출에 실패했습니다.');
      }

      setLinkUrl('');
      setImageBase64('');
      setImageName('');
      setSessionNo(SESSION_OPTIONS[0]);
      setStatusMessage('제출되었습니다.');
      await loadAssignments();
    } catch (error: any) {
      console.error('[AssignmentTab] Failed to submit assignment', error);
      setSubmitError(error?.message || '과제 제출에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white/70 px-5 py-6 shadow-soft">
        <div>
          <h3 className="text-base font-semibold text-ellieGray">과제 제출</h3>
          <p className="mt-1 text-sm text-ellieGray/70">이미지 또는 링크로 과제를 제출하세요.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-sm font-semibold text-ellieGray" htmlFor="session-select">
            회차 선택
          </label>
          <select
            id="session-select"
            className="rounded-xl border border-[#f1e6c7] px-3 py-2 text-sm text-ellieGray"
            value={sessionNo}
            onChange={(event) => setSessionNo(event.target.value)}
          >
            {SESSION_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}회차
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-ellieGray" htmlFor="assignment-image">
            이미지 업로드
          </label>
          <input
            id="assignment-image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full rounded-xl border border-[#f1e6c7] px-3 py-2 text-sm text-ellieGray"
          />
          {imageName ? <p className="text-xs text-ellieGray/70">선택된 파일: {imageName}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-ellieGray" htmlFor="assignment-link">
            링크 제출
          </label>
          <input
            id="assignment-link"
            type="url"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="제출 링크를 입력하세요"
            className="w-full rounded-xl border border-[#f1e6c7] px-3 py-2 text-sm text-ellieGray"
          />
        </div>

        {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}
        {statusMessage ? <p className="text-sm text-ellieGray/70">{statusMessage}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-[#ffd331] px-4 py-2 text-sm font-semibold text-ellieGray shadow-soft disabled:opacity-50"
        >
          {isSubmitting ? '제출 중...' : '제출하기'}
        </button>
      </form>

      <section className="space-y-3 rounded-2xl bg-white/70 px-5 py-6 shadow-soft">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-ellieGray">제출된 과제</h3>
          <p className="text-sm text-ellieGray/70">최근 제출 순으로 정렬됩니다.</p>
        </div>

        {loadingList ? (
          <p className="text-sm text-ellieGray/70">과제 목록을 불러오는 중입니다...</p>
        ) : listError ? (
          <p className="text-sm text-red-500">{listError}</p>
        ) : assignments.length === 0 ? (
          <p className="text-sm text-ellieGray/70">제출된 과제가 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {assignments.map((item) => (
              <li key={item.id} className="rounded-2xl bg-ivory/80 px-4 py-3">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ellieGray/70">
                    {item.session_no ? <span className="font-semibold">{item.session_no}회차</span> : null}
                    {item.created_at ? <span>{formatDateTime(item.created_at)}</span> : null}
                  </div>
                  {item.link_url ? (
                    <a
                      href={item.link_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-[#d98200] underline"
                    >
                      제출 링크 열기
                    </a>
                  ) : null}
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt="제출 이미지"
                      className="max-h-64 w-full rounded-xl object-contain"
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default AssignmentTab;
