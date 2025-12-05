import React, { useCallback, useEffect, useMemo, useState } from 'react';

import AssignmentList from '@/components/classroom/AssignmentList';
import AssignmentProgressBar from '@/components/classroom/AssignmentProgressBar';
import AssignmentUploadForm from '@/components/classroom/AssignmentUploadForm';
import CertificateDownload from '@/components/classroom/CertificateDownload';
import { fetchAssignments, submitAssignment, type AssignmentWithRelations, type CreateAssignmentPayload } from '@/lib/api/assignments';
import { getAuthUser } from '@/lib/authUser';
import { getSessionCount } from '@/lib/utils/getSessionCount';

type AssignmentTabProps = {
  classId: string;
};

function AssignmentTab({ classId }: AssignmentTabProps) {
  // -------------------------
  // ✔ authUser 최신 방식(id 사용)
  // -------------------------
  const authUser = useMemo(() => getAuthUser(), []);

  const studentId = authUser?.id ?? null;

  const getAuthHeaders = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : null;
  }, []);

  const [assignments, setAssignments] = useState<AssignmentWithRelations[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [submitError, setSubmitError] = useState('');
  const [listError, setListError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const [classInfo, setClassInfo] = useState<any>(null);
  const [classInfoError, setClassInfoError] = useState('');
  const [classInfoLoading, setClassInfoLoading] = useState(false);

  const [certificateUrl, setCertificateUrl] = useState('');

  const sessionCount = useMemo(() => getSessionCount(classInfo?.name ?? classInfo?.code ?? ''), [classInfo]);

  const completedSessions = useMemo(
    () => new Set(assignments.map((item) => item.session_no)).size,
    [assignments],
  );

  const isCompleted = useMemo(
    () => sessionCount > 0 && completedSessions === sessionCount && sessionCount > 0,
    [completedSessions, sessionCount],
  );

  // -------------------------
  // ✔ 1) 수업 날짜 불러오기
  // -------------------------
  const loadClassInfo = useCallback(async () => {
    setClassInfoLoading(true);
    setClassInfoError('');

    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/class-info-get?id=${encodeURIComponent(classId)}`, {
        ...(headers ? { headers } : {}),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const payload = await res.json();
      const classInfo = payload.classInfo ?? payload.data ?? payload.class;
      if (!classInfo) throw new Error('NO_CLASS_INFO');

      setClassInfo(classInfo);
    } catch (e) {
      console.error(e);
      setClassInfoError('수업 정보를 불러오지 못했습니다. 제출 기간 확인 불가.');
      setClassInfo(null);
    } finally {
      setClassInfoLoading(false);
    }
  }, [classId, getAuthHeaders]);

  useEffect(() => {
    loadClassInfo();
  }, [loadClassInfo]);

  // -------------------------
  // ✔ 3) 제출 기간 체크
  // -------------------------
  const allowSubmission = useMemo(() => {
    if (!classInfo?.start_date || !classInfo?.end_date) return true;

    const now = new Date();
    const s = new Date(classInfo.start_date);
    const e = new Date(classInfo.end_date);

    if (isNaN(s.getTime()) || isNaN(e.getTime())) return true;

    return now >= s && now <= e;
  }, [classInfo]);

  // -------------------------
  // ✔ 4) 과제 목록 로드 (classroom_id + profiles 기반 student_id)
  // -------------------------
  const loadAssignments = useCallback(async () => {
    if (!studentId) return;

    setLoadingList(true);
    setListError('');

    try {
      const list = await fetchAssignments({
        class_id: Number(classId),
        student_id: studentId,
      });

      setAssignments(list ?? []);
    } catch {
      setListError('과제 목록을 불러오는 중 오류가 발생했습니다.');
      setAssignments([]);
    } finally {
      setLoadingList(false);
    }
  }, [studentId, classId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    const generateCertificate = async () => {
      if (!isCompleted || !studentId || !classId) return;
      if (certificateUrl) return;

      try {
        const headers = getAuthHeaders();
        const res = await fetch(`/api/certificate-generate?class_id=${encodeURIComponent(classId)}&user_id=${encodeURIComponent(studentId)}`, {
          ...(headers ? { headers } : {}),
        });

        if (res.ok) {
          const data = await res.json();
          setCertificateUrl(data.url ?? '');
        }
      } catch (error) {
        console.error(error);
      }
    };

    generateCertificate();
  }, [certificateUrl, classId, getAuthHeaders, isCompleted, studentId]);

  // -------------------------
  // ✔ 5) 과제 제출
  // -------------------------
  const handleSubmit = async (values: {
    sessionNo: number;
    assignmentType: 'image' | 'link' | 'text';
    linkUrl?: string;
    textContent?: string;
    imageBase64?: string;
  }) => {
    setSubmitError('');
    setStatusMessage('');

    if (!allowSubmission) {
      setSubmitError('제출 기간이 아닙니다.');
      return;
    }

    if (!studentId) {
      setSubmitError('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);

    const payload: CreateAssignmentPayload = {
      class_id: Number(classId),
      student_id: studentId,
      session_no: values.sessionNo,
      content_type: values.assignmentType,
      link_url: values.assignmentType === 'link' ? values.linkUrl : null,
      text_content: values.assignmentType === 'text' ? values.textContent : null,
      image_base64: values.assignmentType === 'image' ? values.imageBase64 : null,
    };

    try {
      await submitAssignment(payload);
      setStatusMessage('성공적으로 제출되었습니다.');

      await loadAssignments();
    } catch (err) {
      setSubmitError('과제 제출 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="space-y-6">
      {classInfoLoading && <p className="text-sm text-ellieGray/70">수업 정보를 불러오는 중...</p>}
      {classInfoError && <p className="text-red-500 text-sm">{classInfoError}</p>}

      {sessionCount > 1 && (
        <AssignmentProgressBar totalSessions={sessionCount} completedSessions={completedSessions} />
      )}

      <AssignmentUploadForm
        className={classInfo?.name ?? ''}
        onSubmit={handleSubmit}
        allowSubmission={allowSubmission}
        submitting={isSubmitting}
        submitError={submitError}
        statusMessage={statusMessage}
      />

      {isCompleted && <CertificateDownload completed={isCompleted} certificateUrl={certificateUrl} />}

      <section className="rounded-2xl bg-white/70 px-5 py-6 shadow-soft">
        <h3 className="font-semibold mb-3">제출된 과제</h3>

        {loadingList && <p className="text-sm">불러오는 중...</p>}
        {listError && <p className="text-red-500">{listError}</p>}

        {!loadingList && <AssignmentList assignments={assignments} />}
      </section>
    </div>
  );
}

export default AssignmentTab;
