import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../hooks/useAuthUser';
import { getVerifiedCode, setVerifiedCode, verifyCourseCode } from '../lib/course-verification';

function CourseCard({ course, accentColor }: { [key: string]: any }) {
  const { name, link, description, linkState } = course;
  const navigate = useNavigate();
  const [showNotice, setShowNotice] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { user: authUser } = useAuthUser();
  const isAdmin = authUser?.role === 'admin';

  const courseId = useMemo(() => {
    if (course.courseId) {
      return course.courseId;
    }

    if (link && typeof link === 'string') {
      const segments = link.split('/').filter(Boolean);
      return segments[segments.length - 1] ?? null;
    }

    return null;
  }, [course.courseId, link]);

  useEffect(() => {
    if (!showNotice) {
      return undefined;
    }

    const timer = window.setTimeout(() => setShowNotice(false), 2400);
    return () => window.clearTimeout(timer);
  }, [showNotice]);

  const handleUnavailableClick = () => {
    setShowNotice(true);
  };

  const handleNavigateToCourse = () => {
    if (!link) {
      return;
    }

    if (linkState) {
      navigate(link, { state: linkState });
    } else {
      navigate(link);
    }
  };

  const handleOpenCourse = () => {
    if (!link) {
      handleUnavailableClick();
      return;
    }

    if (isAdmin || !courseId) {
      handleNavigateToCourse();
      return;
    }

    const savedCode = getVerifiedCode(courseId);
    if (savedCode) {
      handleNavigateToCourse();
      return;
    }

    setErrorMessage('');
    setInputCode('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) {
      return;
    }
    setIsModalOpen(false);
    setErrorMessage('');
    setInputCode('');
  };

  const handleConfirm = async () => {
    if (!courseId) {
      return;
    }

    if (!inputCode.trim()) {
      setErrorMessage('수강 코드를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const result = await verifyCourseCode(courseId, inputCode);

    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.message ?? '유효하지 않은 코드입니다.');
      return;
    }

    setVerifiedCode(courseId, inputCode);
    setIsModalOpen(false);
    setInputCode('');
    setErrorMessage('');
    handleNavigateToCourse();
  };

  const actionClasses =
    'inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium text-ellieGray shadow-soft transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ellieYellow/80';

  return (
    <article className="rounded-3xl bg-white px-5 py-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-ellieGray">{name}</h3>
        {link ? (
          <button
            type="button"
            onClick={handleOpenCourse}
            className={actionClasses}
            style={{ backgroundColor: accentColor }}
          >
            수강하기
          </button>
        ) : (
          <button
            type="button"
            onClick={handleUnavailableClick}
            className={actionClasses}
            style={{ backgroundColor: accentColor }}
          >
            수강하기
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-ellieGray/70">
        {showNotice
          ? '현재 준비 중인 강의입니다. 오픈 소식은 곧 안내드릴게요!'
          : description ?? `엘리의방 전용 강의실에서 ${name} 강의를 만나보세요.`}
      </p>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center text-ellieGray shadow-soft">
            <h2 className="text-lg font-semibold">수강 코드를 입력해주세요</h2>
            <p className="mt-2 text-sm text-ellieGray/70">
              안내받은 수강 코드를 입력하면 강의실에 입장할 수 있어요.
            </p>
            <input
              type="text"
              value={inputCode}
              onChange={(event) => setInputCode(event.target.value)}
              className="mt-4 w-full rounded-2xl border border-ellieGray/20 bg-ivory px-4 py-2 text-sm focus:border-ellieGray focus:outline-none focus:ring-2 focus:ring-[#fef568]/60"
              placeholder="수강 코드"
              autoFocus
              disabled={isSubmitting}
            />
            {errorMessage && (
              <p className="mt-2 text-sm font-medium text-red-500">{errorMessage}</p>
            )}
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 rounded-full border border-ellieGray/20 px-4 py-2 text-sm font-semibold text-ellieGray transition-colors hover:bg-ellieGray/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ellieGray/30"
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-full px-4 py-2 text-sm font-semibold text-ellieGray shadow-soft transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fef568]/60"
                style={{ backgroundColor: '#fef568' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? '확인 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export default CourseCard;
