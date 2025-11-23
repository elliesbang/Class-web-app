import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { getStoredAuthUser } from '@/lib/authUser';
import { supabase } from '@/lib/supabaseClient';

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

const formatDateTime = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

function AssignmentTab({ classId }: AssignmentTabProps) {
  const authUser = useMemo(() => getStoredAuthUser(), []);

  const [sessionNo, setSessionNo] = useState('1');
  const [sessions, setSessions] = useState<any[]>([]);

  const [linkUrl, setLinkUrl] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [imageName, setImageName] = useState('');

  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [submitError, setSubmitError] = useState('');
  const [listError, setListError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const [classInfo, setClassInfo] = useState<any>(null);
  const [classInfoError, setClassInfoError] = useState('');

  // ⬇ 1) 수업 정보 로드 (start_date, end_date)
  useEffect(() => {
    const loadClass = async () => {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('start_date, end_date')
          .eq('id', classId)
          .single();

        if (error) throw error;
        setClassInfo(data);
        setClassInfoError('');
      } catch (err) {
        setClassInfoError('수업 정보를 불러오지 못했습니다. 제출 기간 확인 불가.');
        setClassInfo(null);
      }
    };
    loadClass();
  }, [classId]);

  // ⬇ 2) 세션 로드 (fallback 포함)
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const { data, error } = await supabase
          .from('classroom_sessions')
          .select('*')
          .eq('classroom_id', classId)
          .order('session_no', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setSessions(data);
          setSessionNo(String(data[0].session_no));
        } else {
          const fallback = Array.from({ length: 15 }).map((_, i) => ({
            session_no: i + 1,
          }));
          setSessions(fallback);
          setSessionNo('1');
        }
      } catch (err) {
        const fallback = Array.from({ length: 15 }).map((_, i) => ({
          session_no: i + 1,
        }));
        setSessions(fallback);
        setSessionNo('1');
      }
    };

    loadSessions();
  }, [classId]);

  // ⬇ 제출 가능 여부
  const allowSubmission = useMemo(() => {
    if (!classInfo?.start_date || !classInfo?.end_date) return true;

    const now = new Date();
    const s = new Date(classInfo.start_date);
    const e = new Date(classInfo.end_date);

    if (isNaN(s.getTime()) || isNaN(e.getTime())) return true;

    return now >= s && now <= e;
  }, [classInfo]);

  // ⬇ 3) 과제 목록 로드
  const loadAssignments = useCallback(async () => {
    if (!authUser?.user_id) return;

    setLoadingList(true);
    setListError('');

    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('classroom_id', classId)
        .eq('student_id', authUser.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAssignments(data ?? []);
    } catch (err) {
      setListError('과제 목록을 불러오는 중 오류가 발생했습니다.');
      setAssignments([]);
    } finally {
      setLoadingList(false);
    }
  }, [authUser?.user_id, classId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // ⬇ 4) 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitError('');
    setStatusMessage('');

    if (!allowSubmission) {
      setSubmitError('제출 기간이 아닙니다.');
      return;
    }

    const payload = {
      classroom_id: classId,
      student_id: authUser.user_id,
      session_no: Number(sessionNo),
      link_url: linkUrl.trim() || null,
      image_base64: imageBase64 || null,
    };

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/assignment-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authUser.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('failed');

      setLinkUrl('');
      setImageBase64('');
      setImageName('');
      setStatusMessage('제출되었습니다.');
      await loadAssignments();
    } catch (err) {
      setSubmitError('과제 제출 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* 제출 폼 */}
      <form onSubmit={handleSubmit} className="rounded-2xl bg-white/70 px-5 py-6 shadow-soft space-y-4">
        <div>
          <h3 className="font-semibold text-ellieGray">과제 제출</h3>
          <p className="text-sm text-ellieGray/70">이미지 또는 링크로 제출하세요.</p>
          {classInfoError && <p className="text-red-500 text-sm">{classInfoError}</p>}
        </div>

        {/* 회차 선택 */}
        <div className="flex gap-2 items-center">
          <label className="text-sm font-semibold">회차 선택</label>
          <select className="border rounded-xl px-3 py-2" value={sessionNo} onChange={(e) => setSessionNo(e.target.value)}>
            {sessions.map((s) => (
              <option key={s.session_no} value={s.session_no}>
                {s.session_no}회차
              </option>
            ))}
          </select>
        </div>

        {/* 이미지 업로드 */}
        <div>
          <label className="text-sm font-semibold">이미지 업로드</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          {imageName && <p className="text-xs">{imageName}</p>}
        </div>

        {/* 링크 제출 */}
        <div>
          <label className="text-sm font-semibold">링크 제출</label>
          <input
            className="border rounded-xl px-3 py-2 w-full"
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
        </div>

        {submitError && <p className="text-red-500 text-sm">{submitError}</p>}
        {statusMessage && <p className="text-sm">{statusMessage}</p>}

        <button
          type="submit"
          disabled={isSubmitting || !allowSubmission}
          className="bg-[#ffd331] rounded-2xl px-4 py-2 font-semibold text-ellieGray shadow-soft w-full"
        >
          {isSubmitting ? '제출 중...' : '제출하기'}
        </button>
      </form>

      {/* 제출된 과제 */}
      <section className="rounded-2xl bg-white/70 px-5 py-6 shadow-soft">
        <h3 className="font-semibold mb-3">제출된 과제</h3>

        {loadingList && <p className="text-sm">불러오는 중...</p>}
        {listError && <p className="text-red-500">{listError}</p>}
        {!loadingList && assignments.length === 0 && <p className="text-sm">제출된 과제가 없습니다.</p>}

        <ul className="space-y-3">
          {assignments.map((item) => (
            <li key={item.id} className="bg-ivory/80 rounded-xl p-4">
              <div className="flex flex-col gap-2 text-xs">
                <span>{item.session_no}회차</span>
                <span>{formatDateTime(item.created_at)}</span>

                {item.link_url && (
                  <a href={item.link_url} target="_blank" className="text-[#d98200] underline text-sm font-semibold">
                    제출 링크
                  </a>
                )}
                {item.image_url && <img src={item.image_url} className="rounded-xl max-h-64 object-contain" />}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default AssignmentTab;
