import { type FormEvent, type MouseEvent, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { authenticateStudent, saveStudentAccess } from '../lib/auth';
import { getRouteByClassName } from '../lib/classAccess';

const Header = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginView, setLoginView] = useState<'selection' | 'student' | 'admin'>('selection');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const goBackToSelection = () => {
    setLoginView('selection');
  };
  const resetStudentForm = () => {
    setStudentName('');
    setStudentEmail('');
    setErrorMessage(null);
    setIsSubmitting(false);
  };
  const openLoginModal = () => {
    goBackToSelection();
    resetStudentForm();
    setIsLoginModalOpen(true);
  };
  const closeLoginModal = () => {
    goBackToSelection();
    resetStudentForm();
    setIsLoginModalOpen(false);
  };
  const openStudentLogin = () => {
    setLoginView('student');
  };
  const openAdminLogin = () => {
    setLoginView('admin');
  };
  const stopPropagation = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const handleStudentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = studentName.trim();
    const trimmedEmail = studentEmail.trim();

    if (!trimmedName || !trimmedEmail) {
      setErrorMessage('이름과 이메일을 모두 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const accessList = await authenticateStudent({ name: trimmedName, email: trimmedEmail });
      saveStudentAccess(accessList);

      const firstClass = accessList[0];
      const redirectRoute = firstClass ? getRouteByClassName(firstClass.className) : null;

      closeLoginModal();
      window.alert('로그인 성공!');

      if (redirectRoute) {
        navigate(redirectRoute);
      } else {
        navigate('/mypage');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '수강생 인증에 실패했습니다.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const enterAdminDashboard = () => {
    closeLoginModal();
    navigate('/admin');
  };

  const modal =
    isLoginModalOpen &&
    createPortal(
      <div
        className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-black/30 px-6 py-10 sm:py-0"
        onClick={closeLoginModal}
        role="presentation"
      >
        <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-xl" onClick={stopPropagation}>
          {loginView === 'selection' ? (
            <>
              <p className="mb-4 text-base font-semibold text-gray-800">로그인 유형을 선택하세요</p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={openStudentLogin}
                  className="rounded-full bg-[#fef568] px-4 py-2 text-sm font-semibold text-[#404040] shadow-[0_4px_10px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#f6e94f]"
                >
                  수강생
                </button>
                <button
                  type="button"
                  onClick={openAdminLogin}
                  className="rounded-full border border-[#f0e7c6] px-4 py-2 text-sm font-semibold text-[#404040] transition-colors hover:border-[#e3d89f] hover:bg-[#fef568]/40"
                >
                  관리자
                </button>
              </div>
            </>
          ) : loginView === 'student' ? (
            <>
              <p className="mb-4 text-base font-semibold text-gray-800">수강생 정보를 입력하세요</p>
              <form className="flex flex-col gap-4 text-left" onSubmit={handleStudentSubmit}>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600" htmlFor="student-name">
                    이름
                  </label>
                  <input
                    id="student-name"
                    type="text"
                    value={studentName}
                    onChange={(event) => setStudentName(event.target.value)}
                    placeholder="이름을 입력하세요"
                    className="w-full rounded-full border border-[#f0e7c6] px-4 py-2 text-sm text-[#404040] focus:border-[#f6e94f] focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600" htmlFor="student-email">
                    이메일
                  </label>
                  <input
                    id="student-email"
                    type="email"
                    value={studentEmail}
                    onChange={(event) => setStudentEmail(event.target.value)}
                    placeholder="이메일을 입력하세요"
                    className="w-full rounded-full border border-[#f0e7c6] px-4 py-2 text-sm text-[#404040] focus:border-[#f6e94f] focus:outline-none"
                  />
                </div>
                {errorMessage && <p className="text-xs font-semibold text-red-500">{errorMessage}</p>}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-[#fef568] px-4 py-2 text-sm font-semibold text-[#404040] shadow-[0_4px_10px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#f6e94f] disabled:opacity-60"
                >
                  {isSubmitting ? '로그인 중...' : '로그인'}
                </button>
              </form>
              <button
                type="button"
                onClick={goBackToSelection}
                className="mt-3 text-xs font-semibold text-ellieGray underline"
              >
                이전으로
              </button>
            </>
          ) : (
            <>
              <p className="mb-4 text-base font-semibold text-gray-800">
                관리자 전용 대시보드로 바로 이동할 수 있어요.
              </p>
              <div className="flex flex-col gap-4 text-left">
                <button
                  type="button"
                  onClick={enterAdminDashboard}
                  className="w-full rounded-full bg-[#fef568] px-4 py-2 text-sm font-semibold text-[#404040] shadow-[0_4px_10px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#f6e94f]"
                >
                  대시보드 바로가기
                </button>
              </div>
              <button
                type="button"
                onClick={goBackToSelection}
                className="mt-3 text-xs font-semibold text-ellieGray underline"
              >
                이전으로
              </button>
            </>
          )}
          <button type="button" onClick={closeLoginModal} className="mt-5 text-xs font-semibold text-ellieGray underline">
            닫기
          </button>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <header className="fixed top-0 z-30 w-full bg-white/90 shadow-md backdrop-blur">
        <div className="flex h-16 items-center justify-between px-5">
          <a href="/" className="text-lg font-semibold text-gray-800">
            엘리의방 클래스
          </a>
          <button
            type="button"
            onClick={openLoginModal}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ellieGray shadow-sm transition-colors hover:bg-[#fef568]/40"
          >
            로그인
          </button>
        </div>
      </header>
      {modal}
    </>
  );
};

export default Header;
